import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import LoginScreen from './features/auth/LoginScreen'
import LobbyScreen from './features/lobby/LobbyScreen'
import { findCurrentRoom } from './features/lobby/recovery'
import type { RoomSnapshot } from './features/lobby/roomApi'
import LudoMatchScreen from './features/match/LudoMatchScreen'
import { supabase } from './lib/supabase'
import './styles.css'

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null)
  const recoveredUserId = useRef<string | null>(null)

  useEffect(() => {
    let mounted = true

    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return
      setSession(nextSession)
      if (!nextSession) {
        setSnapshot(null)
        recoveredUserId.current = null
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const userId = session?.user.id
    if (!userId || recoveredUserId.current === userId) return
    recoveredUserId.current = userId

    let cancelled = false
    void findCurrentRoom(userId)
      .then((room) => {
        if (!cancelled && room) setSnapshot(room)
      })
      .catch((error) => console.warn('CAPTA CITY: active room recovery failed', error))

    return () => {
      cancelled = true
    }
  }, [session?.user.id])

  if (session === undefined) {
    return (
      <main className="boot-shell" aria-label="Carregando CAPTA CITY">
        <div className="boot-logo">🎲</div>
        <strong>CAPTA CITY</strong>
        <span>Conectando ao jogo…</span>
      </main>
    )
  }

  if (!session) return <LoginScreen />

  if (snapshot && snapshot.room.status !== 'waiting') {
    return (
      <LudoMatchScreen
        user={session.user}
        snapshot={snapshot}
        onSnapshot={setSnapshot}
        onExit={() => setSnapshot(null)}
      />
    )
  }

  return <LobbyScreen user={session.user} snapshot={snapshot} onSnapshot={setSnapshot} />
}
