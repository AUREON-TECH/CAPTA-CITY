import { useCallback, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import {
  createRoom,
  getRoomSnapshot,
  joinRoomByCode,
  playNow,
  setPlayerReady,
  startRoom,
  type RoomSnapshot,
} from './roomApi'
import { useRoomRealtime } from './useRoomRealtime'

type LobbyScreenProps = {
  user: User
  snapshot: RoomSnapshot | null
  onSnapshot: (snapshot: RoomSnapshot | null) => void
}

const COLOR_NAMES = {
  red: 'Vermelho',
  blue: 'Azul',
  green: 'Verde',
  yellow: 'Amarelo',
} as const

export default function LobbyScreen({ user, snapshot, onSnapshot }: LobbyScreenProps) {
  const [joinCode, setJoinCode] = useState('')
  const [showJoin, setShowJoin] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!snapshot?.room.id) return
    try {
      const latest = await getRoomSnapshot(snapshot.room.id)
      onSnapshot(latest)
    } catch (refreshError) {
      console.warn('CAPTA CITY realtime refresh failed', refreshError)
    }
  }, [snapshot?.room.id, onSnapshot])

  useRoomRealtime(snapshot?.room.id ?? null, refresh)

  const me = useMemo(
    () => snapshot?.players.find((player) => player.user_id === user.id) ?? null,
    [snapshot?.players, user.id],
  )

  async function run(action: () => Promise<RoomSnapshot>) {
    setBusy(true)
    setError('')
    try {
      onSnapshot(await action())
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Não foi possível concluir esta ação.')
    } finally {
      setBusy(false)
    }
  }

  if (!snapshot) {
    return (
      <main className="lobby-shell">
        <section className="lobby-card">
          <header className="lobby-header">
            <div>
              <p className="eyebrow">AUREON GAMES • ONLINE</p>
              <h1>CAPTA CITY</h1>
              <p>Ludo da captação • 4 jogadores</p>
            </div>
            <div className="user-badge">
              {user.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} alt="" /> : <span>👤</span>}
              <div><strong>{user.user_metadata?.full_name || user.email}</strong><small>Conta Google conectada</small></div>
            </div>
          </header>

          <div className="lobby-actions">
            <button type="button" className="lobby-action lobby-action--primary" disabled={busy} onClick={() => run(() => createRoom(user))}>
              <span>🏙️</span><strong>CRIAR SALA</strong><small>Receba um código e convide 3 pessoas</small>
            </button>
            <button type="button" className="lobby-action" disabled={busy} onClick={() => setShowJoin((value) => !value)}>
              <span>🔑</span><strong>ENTRAR POR CÓDIGO</strong><small>Entre em uma sala da sua equipe</small>
            </button>
            <button type="button" className="lobby-action lobby-action--quick" disabled={busy} onClick={() => run(() => playNow(user))}>
              <span>⚡</span><strong>JOGAR AGORA</strong><small>Procura uma sala online automaticamente</small>
            </button>
          </div>

          {showJoin ? (
            <form className="join-panel" onSubmit={(event) => {
              event.preventDefault()
              void run(() => joinRoomByCode(user, joinCode))
            }}>
              <label htmlFor="capta-room-code">Código da sala</label>
              <div>
                <input id="capta-room-code" value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} maxLength={6} placeholder="CITY77" autoComplete="off" />
                <button type="submit" disabled={busy || joinCode.length !== 6}>ENTRAR</button>
              </div>
            </form>
          ) : null}

          {error ? <p className="lobby-error" role="alert">{error}</p> : null}
          <button type="button" className="text-action" onClick={() => void supabase.auth.signOut()}>Sair da conta</button>
        </section>
      </main>
    )
  }

  const host = snapshot.room.host_user_id === user.id

  return (
    <main className="waiting-shell">
      <section className="waiting-card">
        <header className="waiting-header">
          <div>
            <p className="eyebrow">SALA ONLINE</p>
            <h1>{snapshot.room.code}</h1>
            <p>Compartilhe este código. A partida começa com 4 jogadores.</p>
          </div>
          <div className="waiting-count"><strong>{snapshot.players.length}</strong><span>/ 4</span></div>
        </header>

        <div className="player-slots">
          {[0, 1, 2, 3].map((seat) => {
            const player = snapshot.players.find((item) => item.seat === seat)
            const color = (['red', 'blue', 'green', 'yellow'] as const)[seat]
            return (
              <article key={seat} className={`player-slot player-slot--${color}`}>
                <div className="slot-avatar">
                  {player?.avatar_url ? <img src={player.avatar_url} alt="" /> : <span>{player ? '👤' : '＋'}</span>}
                </div>
                <div>
                  <small>{COLOR_NAMES[color]}</small>
                  <strong>{player?.display_name || 'Aguardando jogador…'}</strong>
                  {player ? <span>{player.is_ready ? '✅ Pronto' : '⏳ Entrou na sala'}</span> : <span>Envie o código</span>}
                </div>
              </article>
            )
          })}
        </div>

        {me ? (
          <button type="button" className="ready-action" disabled={busy} onClick={() => run(async () => {
            await setPlayerReady(snapshot.room.id, user.id, !me.is_ready)
            return getRoomSnapshot(snapshot.room.id)
          })}>
            {me.is_ready ? '✅ VOCÊ ESTÁ PRONTO' : 'MARCAR COMO PRONTO'}
          </button>
        ) : null}

        {host ? (
          <button type="button" className="start-game-action" disabled={busy || snapshot.players.length !== 4} onClick={() => run(() => startRoom(snapshot, user.id))}>
            🎲 INICIAR PARTIDA
          </button>
        ) : <p className="waiting-note">Aguardando o criador iniciar a partida…</p>}

        {error ? <p className="lobby-error" role="alert">{error}</p> : null}
        <button type="button" className="text-action" onClick={() => onSnapshot(null)}>Voltar ao lobby</button>
      </section>
    </main>
  )
}
