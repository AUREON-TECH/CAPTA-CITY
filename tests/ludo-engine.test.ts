import { describe, expect, it } from 'vitest'
import {
  CAPTA_SAFE_CELLS,
  createLudoMatch,
  getMovablePieceIds,
  getSharedCell,
  moveLudoPiece,
} from '../src/game/ludo'

const players = [
  { id: 'p1', name: 'Raphael' },
  { id: 'p2', name: 'Jessica' },
  { id: 'p3', name: 'Pedro' },
  { id: 'p4', name: 'Josy' },
]

describe('CAPTA CITY Ludo engine', () => {
  it('requires exactly four players and creates four casal pieces per player', () => {
    expect(() => createLudoMatch(players.slice(0, 3))).toThrow(/four players/i)

    const state = createLudoMatch(players)
    expect(state.turnOrder).toHaveLength(4)
    expect(state.players.p1.pieces).toHaveLength(4)
    expect(state.players.p1.pieces.every((piece) => piece.progress === -1)).toBe(true)
  })

  it('requires a six to launch a casal from base', () => {
    const state = createLudoMatch(players)

    expect(getMovablePieceIds(state, 'p1', 5)).toEqual([])
    expect(getMovablePieceIds(state, 'p1', 6)).toContain('p1-c1')

    const moved = moveLudoPiece(state, 'p1', 'p1-c1', 6)
    expect(moved.state.players.p1.pieces[0].progress).toBe(0)
    expect(moved.state.currentPlayerId).toBe('p1')
  })

  it('captures an opponent on a shared non-safe cell', () => {
    const state = createLudoMatch(players)
    state.players.p1.pieces[0].progress = 5

    const targetGlobalCell = getSharedCell('red', 8)
    expect(CAPTA_SAFE_CELLS.has(targetGlobalCell)).toBe(false)

    const blueProgress = (targetGlobalCell - 13 + 52) % 52
    state.players.p2.pieces[0].progress = blueProgress

    const moved = moveLudoPiece(state, 'p1', 'p1-c1', 3)

    expect(moved.state.players.p1.pieces[0].progress).toBe(8)
    expect(moved.state.players.p2.pieces[0].progress).toBe(-1)
    expect(moved.capturedPieceIds).toEqual(['p2-c1'])
  })

  it('does not capture an opponent on a safe cell', () => {
    const state = createLudoMatch(players)
    state.players.p1.pieces[0].progress = 51
    state.players.p2.pieces[0].progress = 39

    const moved = moveLudoPiece(state, 'p1', 'p1-c1', 1)

    expect(CAPTA_SAFE_CELLS.has(getSharedCell('red', 52))).toBe(true)
    expect(moved.state.players.p2.pieces[0].progress).toBe(39)
    expect(moved.capturedPieceIds).toEqual([])
  })

  it('requires an exact roll to enter the SALA', () => {
    const state = createLudoMatch(players)
    state.players.p1.pieces[0].progress = 55

    expect(getMovablePieceIds(state, 'p1', 3)).not.toContain('p1-c1')
    expect(getMovablePieceIds(state, 'p1', 2)).toContain('p1-c1')

    const moved = moveLudoPiece(state, 'p1', 'p1-c1', 2)
    expect(moved.state.players.p1.pieces[0].progress).toBe(57)
    expect(moved.event?.kind).toBe('delivered')
  })

  it('finishes the match when one player delivers all four casais to the SALA', () => {
    const state = createLudoMatch(players)
    state.players.p1.pieces.forEach((piece, index) => {
      piece.progress = index === 0 ? 56 : 57
    })

    const moved = moveLudoPiece(state, 'p1', 'p1-c1', 1)

    expect(moved.state.status).toBe('finished')
    expect(moved.state.winnerId).toBe('p1')
    expect(moved.state.players.p1.deliveredCouples).toBe(4)
  })
})
