import { LAUNCH_BOARD } from './board'
import type { GamePlayerState, GameState, PlayerInput } from './types'

function createPlayerState(player: PlayerInput): GamePlayerState {
  return {
    id: player.id,
    name: player.name,
    position: 0,
    couples: [],
    deliveredCouples: 0,
    qualifiedCouples: 0,
    nqCouples: 0,
    coins: 500,
    vgv: 0,
    sales: 0,
    score: 0,
    cards: [],
    activeEffects: [],
    skippedTurns: 0,
  }
}

export function createInitialMatch(players: PlayerInput[]): GameState {
  if (players.length < 2 || players.length > 8) {
    throw new Error('CAPTA CITY requires between 2 and 8 players')
  }

  const playerMap = Object.fromEntries(
    players.map((player) => [player.id, createPlayerState(player)]),
  )

  return {
    round: 1,
    maxRounds: 12,
    currentPlayerId: players[0].id,
    turnOrder: players.map((player) => player.id),
    players: playerMap,
    board: LAUNCH_BOARD,
    territories: {},
    events: [],
    status: 'playing',
  }
}

export function movePlayer(state: GameState, playerId: string, spaces: number): GameState {
  const player = state.players[playerId]

  if (!player) {
    throw new Error(`Player ${playerId} does not exist in this match`)
  }

  if (!Number.isInteger(spaces) || spaces < 0) {
    throw new Error('Movement must be a non-negative integer')
  }

  const nextPosition = (player.position + spaces) % state.board.length

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        position: nextPosition,
      },
    },
  }
}
