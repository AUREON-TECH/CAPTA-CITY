import { useCallback, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import LudoBoard from '../../components/LudoBoard'
import { getMovablePieceIds, moveLudoPiece, skipLudoTurn, type LudoState } from '../../game/ludo'
import { supabase } from '../../lib/supabase'
import { getRoomSnapshot, saveGameState, type RoomSnapshot } from '../lobby/roomApi'
import { useRoomRealtime } from '../lobby/useRoomRealtime'

type LudoMatchScreenProps = {
  user: User
  snapshot: RoomSnapshot
  onSnapshot: (snapshot: RoomSnapshot) => void
  onExit: () => void
}

export default function LudoMatchScreen({ user, snapshot, onSnapshot, onExit }: LudoMatchScreenProps) {
  const [pendingRoll, setPendingRoll] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const state = snapshot.room.game_state as LudoState

  const refresh = useCallback(async () => {
    try {
      onSnapshot(await getRoomSnapshot(snapshot.room.id))
    } catch (refreshError) {
      console.warn('CAPTA CITY match refresh failed', refreshError)
    }
  }, [snapshot.room.id, onSnapshot])

  useRoomRealtime(snapshot.room.id, refresh)

  const movablePieceIds = useMemo(() => (
    pendingRoll && state?.status === 'playing'
      ? getMovablePieceIds(state, user.id, pendingRoll)
      : []
  ), [pendingRoll, state, user.id])

  const currentPlayer = state.players[state.currentPlayerId]
  const me = state.players[user.id]
  const ranked = useMemo(() => Object.values(state.players).sort((a, b) =>
    b.deliveredCouples - a.deliveredCouples || b.score - a.score || b.sales - a.sales || b.vgv - a.vgv,
  ), [state.players])

  async function persist(nextState: LudoState, action: string, payload: Record<string, unknown>) {
    setBusy(true)
    setError('')
    try {
      onSnapshot(await saveGameState(snapshot.room, nextState, user.id, action, payload))
      setPendingRoll(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar a jogada.')
      await refresh()
      setPendingRoll(null)
    } finally {
      setBusy(false)
    }
  }

  async function rollDice() {
    if (busy || pendingRoll || state.status !== 'playing' || state.currentPlayerId !== user.id) return
    setBusy(true)
    setError('')

    const { data, error: rollError } = await supabase.rpc('roll_ludo_dice', { p_room_id: snapshot.room.id })
    if (rollError || typeof data !== 'number') {
      setError(rollError?.message || 'Não foi possível rodar o dado.')
      setBusy(false)
      return
    }

    const roll = Number(data)
    const movable = getMovablePieceIds(state, user.id, roll)
    if (movable.length === 0) {
      const skipped = skipLudoTurn(state, user.id, roll)
      setBusy(false)
      await persist(skipped, 'ROLL_NO_MOVE', { roll })
      return
    }

    setPendingRoll(roll)
    setBusy(false)
  }

  function selectPiece(pieceId: string) {
    if (!pendingRoll || busy) return
    try {
      const result = moveLudoPiece(state, user.id, pieceId, pendingRoll)
      void persist(result.state, 'MOVE_PIECE', {
        roll: pendingRoll,
        pieceId,
        captures: result.capturedPieceIds,
        event: result.event?.kind ?? null,
      })
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : 'Jogada inválida.')
    }
  }

  if (!state?.players || !me) {
    return (
      <main className="match-loading">
        <div><strong>Sincronizando partida…</strong><button type="button" onClick={() => void refresh()}>Tentar novamente</button></div>
      </main>
    )
  }

  return (
    <main className="ludo-match-shell">
      <header className="ludo-topbar">
        <div className="match-title"><span>🎲</span><div><small>CAPTA CITY</small><strong>SALA {snapshot.room.code}</strong></div></div>
        <div className="turn-status">
          <small>TURNO</small>
          <strong>{state.winnerId ? 'ENCERRADO' : state.currentPlayerId === user.id ? 'SUA VEZ' : currentPlayer?.name}</strong>
        </div>
        <div className="dice-status" data-testid="last-roll"><small>DADO</small><strong>{pendingRoll ?? state.lastRoll ?? '—'}</strong></div>
        <button type="button" className="match-exit" onClick={onExit}>Sair</button>
      </header>

      {state.lastEvent ? <div className={`capta-event capta-event--${state.lastEvent.kind}`}><strong>{state.lastEvent.message}</strong></div> : null}

      <div className="ludo-layout">
        <section className="ludo-board-wrap">
          <LudoBoard state={state} movablePieceIds={movablePieceIds} onSelectPiece={selectPiece} currentUserId={user.id} />
          <div className="ludo-action-bar">
            <button
              type="button"
              className="mega-dice"
              onClick={() => void rollDice()}
              disabled={busy || pendingRoll !== null || state.status !== 'playing' || state.currentPlayerId !== user.id}
            >
              <span>🎲</span>
              <div><strong>{pendingRoll ? `VOCÊ TIROU ${pendingRoll}` : state.currentPlayerId === user.id ? 'RODAR DADO' : 'AGUARDE SUA VEZ'}</strong><small>{pendingRoll ? 'Escolha um casal destacado no tabuleiro' : 'O resultado vem do servidor'}</small></div>
            </button>
            {pendingRoll ? <p className="piece-instruction">👆 Escolha qual casal vai andar {pendingRoll} casa{pendingRoll === 1 ? '' : 's'}.</p> : null}
          </div>
          {error ? <p className="match-error" role="alert">{error}</p> : null}
        </section>

        <aside className="ludo-sidebar">
          <section className={`my-player-card my-player-card--${me.color}`}>
            <p>SEU JOGO</p>
            <h2>{me.name}</h2>
            <div className="match-stat-grid">
              <div><span>🏁 SALA</span><strong>{me.deliveredCouples}/4</strong></div>
              <div><span>✅ Q</span><strong>{me.qualifiedCouples}</strong></div>
              <div><span>🍾 VENDAS</span><strong>{me.sales}</strong></div>
              <div><span>💰 VGV</span><strong>{me.vgv.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</strong></div>
            </div>
            <footer><span>CAPTA SCORE</span><strong>{me.score.toLocaleString('pt-BR')}</strong></footer>
          </section>

          <section className="ludo-ranking">
            <header><span>🏆</span><div><small>AO VIVO</small><strong>RANKING</strong></div></header>
            <ol>
              {ranked.map((player, index) => (
                <li key={player.id} className={`rank-player rank-player--${player.color}`}>
                  <b>{index + 1}º</b>
                  <span>{player.name}<small>{player.deliveredCouples}/4 na SALA • {player.sales} venda{player.sales === 1 ? '' : 's'}</small></span>
                  <strong>{player.score}</strong>
                </li>
              ))}
            </ol>
          </section>

          <section className="ludo-rules-card">
            <strong>COMO VENCER</strong>
            <p> Tire 6 para colocar um casal na rua. Capture adversários fora das casas ★. Leve os 4 casais até a SALA primeiro.</p>
            <div><span>Q</span><span>NQ</span><span>🍾 Venda</span><span>⚡ Bônus</span></div>
          </section>
        </aside>
      </div>

      {state.winnerId ? (
        <div className="winner-overlay" role="dialog" aria-modal="true" aria-labelledby="winner-title">
          <div className="winner-card">
            <span className="winner-trophy">🏆</span>
            <p>CAPTA CITY</p>
            <h2 id="winner-title">{state.players[state.winnerId]?.name} venceu!</h2>
            <strong>4 casais chegaram à SALA</strong>
            <button type="button" onClick={onExit}>VOLTAR AO LOBBY</button>
          </div>
        </div>
      ) : null}
    </main>
  )
}
