import type { GameState } from './types'

export const TERRITORY_CLAIM_COST = 200

export function claimTerritory(state: GameState, playerId: string, tileId: string): GameState {
  const player = state.players[playerId]
  if (!player) throw new Error(`Player ${playerId} does not exist in this match`)

  const tileIndex = state.board.findIndex((tile) => tile.id === tileId)
  const tile = state.board[tileIndex]

  if (!tile || !tile.claimable) throw new Error('This tile cannot be claimed')
  if (player.position !== tileIndex) throw new Error('Player must be on the territory to claim it')
  if (state.territories[tileId]) throw new Error('Territory already has an owner')
  if (player.coins < TERRITORY_CLAIM_COST) throw new Error('Not enough coins to claim this territory')

  return {
    ...state,
    territories: {
      ...state.territories,
      [tileId]: playerId,
    },
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        coins: player.coins - TERRITORY_CLAIM_COST,
      },
    },
  }
}
