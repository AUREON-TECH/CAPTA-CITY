import type { User } from '@supabase/supabase-js'
import { createLudoMatch, type LudoState } from '../../game/ludo'
import { supabase } from '../../lib/supabase'

export type RoomStatus = 'waiting' | 'playing' | 'finished'

export type GameRoom = {
  id: string
  code: string
  host_user_id: string
  status: RoomStatus
  is_matchmaking: boolean
  game_state: LudoState | Record<string, never>
  version: number
  created_at: string
  updated_at: string
}

export type RoomPlayer = {
  room_id: string
  user_id: string
  seat: number
  color: 'red' | 'blue' | 'green' | 'yellow'
  display_name: string
  avatar_url: string | null
  is_ready: boolean
  joined_at: string
}

export type RoomSnapshot = {
  room: GameRoom
  players: RoomPlayer[]
}

const COLORS: RoomPlayer['color'][] = ['red', 'blue', 'green', 'yellow']
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function playerName(user: User) {
  const metadata = user.user_metadata ?? {}
  return String(metadata.full_name || metadata.name || user.email?.split('@')[0] || 'Jogador').slice(0, 40)
}

function playerAvatar(user: User) {
  const metadata = user.user_metadata ?? {}
  const avatar = metadata.avatar_url || metadata.picture
  return typeof avatar === 'string' ? avatar : null
}

function makeRoomCode() {
  const values = new Uint32Array(6)
  crypto.getRandomValues(values)
  return Array.from(values, (value) => CODE_ALPHABET[value % CODE_ALPHABET.length]).join('')
}

async function syncProfile(user: User) {
  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    display_name: playerName(user),
    avatar_url: playerAvatar(user),
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

async function addPlayerToRoom(roomId: string, user: User): Promise<RoomPlayer> {
  const { data: existingMembership } = await supabase
    .from('game_players')
    .select('*')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingMembership) return existingMembership as RoomPlayer

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data: players, error: playersError } = await supabase
      .from('game_players')
      .select('*')
      .eq('room_id', roomId)
      .order('seat', { ascending: true })

    if (playersError) throw playersError
    const occupied = new Set((players ?? []).map((player) => Number(player.seat)))
    const seat = [0, 1, 2, 3].find((candidate) => !occupied.has(candidate))
    if (seat === undefined) throw new Error('Esta sala já está cheia.')

    const { data, error } = await supabase
      .from('game_players')
      .insert({
        room_id: roomId,
        user_id: user.id,
        seat,
        color: COLORS[seat],
        display_name: playerName(user),
        avatar_url: playerAvatar(user),
        is_ready: seat === 0,
      })
      .select('*')
      .single()

    if (!error && data) return data as RoomPlayer
    if (error?.code !== '23505') throw error
  }

  throw new Error('Não foi possível reservar uma cor nesta sala.')
}

export async function getRoomSnapshot(roomId: string): Promise<RoomSnapshot> {
  const [{ data: room, error: roomError }, { data: players, error: playersError }] = await Promise.all([
    supabase.from('game_rooms').select('*').eq('id', roomId).single(),
    supabase.from('game_players').select('*').eq('room_id', roomId).order('seat', { ascending: true }),
  ])

  if (roomError) throw roomError
  if (playersError) throw playersError
  return { room: room as GameRoom, players: (players ?? []) as RoomPlayer[] }
}

export async function createRoom(user: User, matchmaking = false): Promise<RoomSnapshot> {
  await syncProfile(user)

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = makeRoomCode()
    const { data: room, error } = await supabase
      .from('game_rooms')
      .insert({ code, host_user_id: user.id, is_matchmaking: matchmaking })
      .select('*')
      .single()

    if (error?.code === '23505') continue
    if (error) throw error

    await addPlayerToRoom(room.id, user)
    return getRoomSnapshot(room.id)
  }

  throw new Error('Não foi possível gerar um código de sala. Tente novamente.')
}

export async function joinRoomByCode(user: User, rawCode: string): Promise<RoomSnapshot> {
  await syncProfile(user)
  const code = rawCode.trim().toUpperCase()
  if (!/^[A-Z0-9]{6}$/.test(code)) throw new Error('Digite um código de sala com 6 caracteres.')

  const { data: room, error } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('code', code)
    .eq('status', 'waiting')
    .single()

  if (error || !room) throw new Error('Sala não encontrada ou já iniciada.')
  await addPlayerToRoom(room.id, user)
  return getRoomSnapshot(room.id)
}

export async function playNow(user: User): Promise<RoomSnapshot> {
  await syncProfile(user)

  const { data: rooms, error } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('status', 'waiting')
    .eq('is_matchmaking', true)
    .order('created_at', { ascending: true })
    .limit(8)

  if (error) throw error

  for (const room of rooms ?? []) {
    try {
      await addPlayerToRoom(room.id, user)
      return getRoomSnapshot(room.id)
    } catch (joinError) {
      if (!(joinError instanceof Error) || !/cheia|reservar/i.test(joinError.message)) throw joinError
    }
  }

  return createRoom(user, true)
}

export async function setPlayerReady(roomId: string, userId: string, ready: boolean) {
  const { error } = await supabase
    .from('game_players')
    .update({ is_ready: ready })
    .eq('room_id', roomId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function startRoom(snapshot: RoomSnapshot, userId: string): Promise<RoomSnapshot> {
  if (snapshot.room.host_user_id !== userId) throw new Error('Somente o criador pode iniciar a partida.')
  if (snapshot.players.length !== 4) throw new Error('A partida precisa de 4 jogadores.')

  const ordered = [...snapshot.players].sort((a, b) => a.seat - b.seat)
  const gameState = createLudoMatch(ordered.map((player) => ({
    id: player.user_id,
    name: player.display_name,
    avatarUrl: player.avatar_url,
  })))

  const { error } = await supabase
    .from('game_rooms')
    .update({
      status: 'playing',
      game_state: gameState,
      version: snapshot.room.version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', snapshot.room.id)
    .eq('version', snapshot.room.version)

  if (error) throw error
  return getRoomSnapshot(snapshot.room.id)
}

export async function saveGameState(
  room: GameRoom,
  state: LudoState,
  userId: string,
  action: string,
  payload: Record<string, unknown>,
): Promise<RoomSnapshot> {
  const nextVersion = room.version + 1
  const { data, error } = await supabase
    .from('game_rooms')
    .update({
      game_state: state,
      status: state.status === 'finished' ? 'finished' : 'playing',
      version: nextVersion,
      updated_at: new Date().toISOString(),
    })
    .eq('id', room.id)
    .eq('version', room.version)
    .select('id')

  if (error) throw error
  if (!data?.length) throw new Error('A partida recebeu outra jogada. Sincronizando…')

  const { error: turnError } = await supabase.from('game_turns').insert({
    room_id: room.id,
    user_id: userId,
    action,
    payload,
  })
  if (turnError) console.warn('CAPTA CITY turn audit could not be written', turnError)

  return getRoomSnapshot(room.id)
}
