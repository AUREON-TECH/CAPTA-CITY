import { describe, expect, it } from 'vitest'
import { createInitialMatch, movePlayer } from '../src/game/engine'

const players = [
  { id: 'p1', name: 'Raphael' },
  { id: 'p2', name: 'Jessica' },
]

describe('CAPTA CITY game engine', () => {
  it('starts round one with the first player at tile zero', () => {
    const state = createInitialMatch(players)

    expect(state.round).toBe(1)
    expect(state.currentPlayerId).toBe('p1')
    expect(state.players.p1.position).toBe(0)
    expect(state.players.p1.couples).toHaveLength(0)
  })

  it('moves a player around the board', () => {
    const state = createInitialMatch(players)
    const moved = movePlayer(state, 'p1', 6)

    expect(moved.players.p1.position).toBe(6)
  })

  it('wraps movement when passing the final tile', () => {
    const state = createInitialMatch(players)
    const boardLength = state.board.length
    state.players.p1.position = boardLength - 2

    const moved = movePlayer(state, 'p1', 5)

    expect(moved.players.p1.position).toBe(3)
  })
})
