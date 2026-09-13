import { supabase } from '../../lib/supabase'
import { getRoomSnapshot, type RoomSnapshot } from './roomApi'

export async function findCurrentRoom(userId: string): Promise<RoomSnapshot | null> {
  const { data, error } = await supabase
    .from('game_players')
    .select('room_id, joined_at')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })
    .limit(8)

  if (error) throw error

  for (const membership of data ?? []) {
    try {
      const snapshot = await getRoomSnapshot(membership.room_id)
      if (snapshot.room.status !== 'finished') return snapshot
    } catch {
      // The room may have been deleted; try the previous membership.
    }
  }

  return null
}
