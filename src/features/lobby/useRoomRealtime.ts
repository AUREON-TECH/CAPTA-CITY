import { useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function useRoomRealtime(roomId: string | null, onChange: () => void) {
  useEffect(() => {
    if (!roomId) return

    const channel = supabase
      .channel(`capta-city-room-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` },
        onChange,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_players', filter: `room_id=eq.${roomId}` },
        onChange,
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [roomId, onChange])
}
