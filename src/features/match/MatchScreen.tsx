import { useMemo, useState } from 'react'
import DiceButton from '../../components/DiceButton'
import EventBanner from '../../components/EventBanner'
import GameBoard from '../../components/GameBoard'
import LiveRanking from '../../components/LiveRanking'
import PlayerHud from '../../components/PlayerHud'
import { LAUNCH_CARDS } from '../../game/cards'
import { createInitialMatch, movePlayer } from '../../game/engine'
import { GLOBAL_EVENTS, applyGlobalEvent } from '../../game/events'
import { resolveRoomVisit } from '../../game/scoring'
import { claimTerritory } from '../../game/territories'
import type { GamePlayerState, GameState, PlayerInput } from '../../game/types'

type MatchScreenProps = {
  players: PlayerInput[]
  initialState?: GameState
  diceRoll?: () => number
  onExit?: () => void
}

function cloneState(state: GameState): GameState {
  return {
    ...state,
    board: state.board.map((tile) => ({ ...tile })),
    territories: { ...state.territories },
    events: [...state.events],
    turnOrder: [...state.turnOrder],
    players: Object.fromEntries(
      Object.entries(state.players).map(([id, player]) => [
        id,
        {
          ...player,
          couples: player.couples.map((couple) => ({ ...couple })),
          cards: [...player.cards],
          activeEffects: [...player.activeEffects],
        },
      ]),
    ),
  }
}

function defaultDiceRoll() {
  return Math.floor(Math.random() * 6) + 1
}

function replacePlayer(state: GameState, player: GamePlayerState): GameState {
  return {
    ...state,
    players: {
      ...state.players,
      [player.id]: player,
    },
  }
}

function resolveLocalLanding(state: GameState, playerId: string): { state: GameState; message: string } {
  const player = state.players[playerId]
  const tile = state.board[player.position]

  if (!tile) return { state, message: 'A cidade ficou em silêncio nesta casa.' }

  if (tile.type === 'capture') {
    const hasDouble = player.activeEffects.includes('double-capture')
    const requested = hasDouble ? 2 : 1
    const amount = Math.min(requested, Math.max(0, 3 - player.couples.length))
    const additions = Array.from({ length: amount }, (_, index) => ({
      id: `couple-${state.round}-${playerId}-${player.position}-${player.couples.length + index + 1}`,
      status: tile.id === 'couple-2' && index === 0 ? ('vip' as const) : ('captured' as const),
      vip: tile.id === 'couple-2' && index === 0,
    }))

    const nextPlayer = {
      ...player,
      couples: [...player.couples, ...additions],
      activeEffects: hasDouble
        ? player.activeEffects.filter((effect) => effect !== 'double-capture')
        : player.activeEffects,
    }

    return {
      state: replacePlayer(state, nextPlayer),
      message: amount > 0 ? `👫 ${player.name} encontrou ${amount} casal${amount > 1 ? 'is' : ''}!` : '🚫 Limite de 3 casais atingido. Vá para a SALA!',
    }
  }

  if (tile.type === 'chance') {
    const card = LAUNCH_CARDS[(player.position + state.round) % LAUNCH_CARDS.length]
    return {
      state: replacePlayer(state, { ...player, cards: [...player.cards, card.id] }),
      message: `${card.emoji} Carta recebida: ${card.name}!`,
    }
  }

  if (tile.type === 'event') {
    const event = GLOBAL_EVENTS[(player.position + state.round) % GLOBAL_EVENTS.length]
    return {
      state: applyGlobalEvent(state, event.id),
      message: `${event.emoji} Evento ativado: ${event.name}!`,
    }
  }

  if (tile.type === 'bonus') {
    return {
      state: replacePlayer(state, { ...player, coins: player.coins + 100 }),
      message: '⚡ Atalho premiado: +100 moedas!',
    }
  }

  if (tile.type === 'penalty') {
    const shieldIndex = player.activeEffects.indexOf('shield')
    if (shieldIndex >= 0) {
      return {
        state: replacePlayer(state, {
          ...player,
          activeEffects: player.activeEffects.filter((_, index) => index !== shieldIndex),
        }),
        message: '🛡️ Seu Escudo bloqueou o Concorrente!',
      }
    }
    return {
      state: replacePlayer(state, { ...player, coins: Math.max(0, player.coins - 100) }),
      message: '🚨 Concorrente na área: -100 moedas.',
    }
  }

  if (tile.type === 'mission') {
    return {
      state: replacePlayer(state, { ...player, score: player.score + 200 }),
      message: '🎯 Missão Relâmpago concluída: +200 CAPTA SCORE!',
    }
  }

  if (tile.type === 'room' && player.couples.length > 0) {
    const outcomes = player.couples.map((couple, index) => {
      const qualified = couple.vip || index < 2
      const converted = qualified && (couple.vip || index === 0)
      return {
        coupleId: couple.id,
        qualified,
        converted,
        vgv: converted ? 75000 + state.round * 5000 : 0,
      }
    })
    const resolved = resolveRoomVisit(state, playerId, outcomes)
    const sales = outcomes.filter((outcome) => outcome.converted).length
    const vgv = outcomes.reduce((sum, outcome) => sum + outcome.vgv, 0)
    return {
      state: resolved,
      message: `🍾 SALA resolvida: ${sales} venda${sales === 1 ? '' : 's'} • ${vgv.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} VGV`,
    }
  }

  if (tile.type === 'room') {
    return { state, message: '🏢 Você chegou à SALA sem casais. Continue a rota!' }
  }

  return { state, message: `${tile.emoji} ${tile.name}: ${tile.description}` }
}

export default function MatchScreen({ players, initialState, diceRoll = defaultDiceRoll, onExit }: MatchScreenProps) {
  const [game, setGame] = useState<GameState>(() => initialState ? cloneState(initialState) : createInitialMatch(players))
  const [lastRoll, setLastRoll] = useState<number | null>(null)
  const [rolledThisTurn, setRolledThisTurn] = useState(false)
  const [message, setMessage] = useState('🎮 Partida iniciada. Raphael abre a cidade!')

  const currentPlayer = game.players[game.currentPlayerId]
  const currentTile = game.board[currentPlayer.position]
  const territoryOwner = game.territories[currentTile.id]
  const canClaim = rolledThisTurn && currentTile.claimable && !territoryOwner && currentPlayer.coins >= 200

  const cardNames = useMemo(
    () => currentPlayer.cards.map((id) => LAUNCH_CARDS.find((card) => card.id === id)).filter(Boolean),
    [currentPlayer.cards],
  )

  function handleRoll() {
    if (rolledThisTurn || game.status !== 'playing') return
    const rawRoll = Number(diceRoll())
    const roll = Number.isInteger(rawRoll) ? Math.min(6, Math.max(1, rawRoll)) : 1
    const moved = movePlayer(game, game.currentPlayerId, roll)
    const resolved = resolveLocalLanding(moved, game.currentPlayerId)

    setGame(resolved.state)
    setLastRoll(roll)
    setRolledThisTurn(true)
    setMessage(resolved.message)
  }

  function handleClaim() {
    try {
      const next = claimTerritory(game, currentPlayer.id, currentTile.id)
      setGame(next)
      setMessage(`🏙️ ${currentPlayer.name} conquistou ${currentTile.name}!`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível conquistar este território.')
    }
  }

  function handleEndTurn() {
    if (!rolledThisTurn) return
    const currentIndex = game.turnOrder.indexOf(game.currentPlayerId)
    const nextIndex = (currentIndex + 1) % game.turnOrder.length
    const startsNewRound = nextIndex === 0
    const nextRound = startsNewRound ? game.round + 1 : game.round

    if (nextRound > game.maxRounds) {
      setGame({ ...game, status: 'finished' })
      setMessage('🏆 FIM DA PARTIDA! Confira o ranking final.')
      setRolledThisTurn(true)
      return
    }

    const nextPlayerId = game.turnOrder[nextIndex]
    setGame({ ...game, round: nextRound, currentPlayerId: nextPlayerId })
    setLastRoll(null)
    setRolledThisTurn(false)
    setMessage(`🎲 Vez de ${game.players[nextPlayerId].name}.`)
  }

  return (
    <main className="match-screen">
      <header className="match-topbar">
        <div className="match-brand">
          <span className="mini-logo">🎲</span>
          <div><small>AUREON GAMES</small><strong>CAPTA CITY</strong></div>
        </div>
        <div className="round-chip">RODADA <strong>{game.round}/{game.maxRounds}</strong></div>
        <div className="turn-chip" data-testid="current-player"><span>VEZ DE</span><strong>{currentPlayer.name}</strong></div>
        {onExit ? <button className="match-exit" type="button" onClick={onExit}>Sair</button> : null}
      </header>

      <EventBanner eventIds={game.events} />

      <div className="match-grid">
        <div className="board-column">
          <GameBoard board={game.board} players={game.players} currentPlayerId={game.currentPlayerId} lastRoll={lastRoll} />
          <div className="game-message" role="status" aria-live="polite">{message}</div>
        </div>
        <LiveRanking players={game.players} />
      </div>

      <div className="match-controls">
        <PlayerHud player={currentPlayer} tileName={currentTile.name} />
        <div className="turn-actions">
          <DiceButton disabled={rolledThisTurn || game.status !== 'playing'} onRoll={handleRoll} />
          {canClaim ? <button className="claim-button" type="button" onClick={handleClaim}>🏙️ CONQUISTAR {currentTile.name} • 200 🪙</button> : null}
          <button className="end-turn-button" type="button" onClick={handleEndTurn} disabled={!rolledThisTurn || game.status !== 'playing'}>ENCERRAR TURNO →</button>
        </div>
        <aside className="inventory-panel" aria-label="Inventário">
          <div><small>🃏 CARTAS</small><strong>{cardNames.length}</strong></div>
          <div><small>⚡ EFEITOS</small><strong>{currentPlayer.activeEffects.length}</strong></div>
          <p>{cardNames.length ? cardNames.map((card) => `${card?.emoji} ${card?.name}`).join(' • ') : 'Caia em uma casa de carta para ganhar poderes.'}</p>
        </aside>
      </div>

      <div className="test-positions" aria-hidden="true">
        {Object.values(game.players).map((player) => (
          <span key={player.id} data-testid={`player-${player.id}-position`}>{player.position}</span>
        ))}
      </div>
    </main>
  )
}
