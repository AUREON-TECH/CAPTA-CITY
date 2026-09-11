import { describe, expect, it } from 'vitest'
import { createInitialMatch } from '../src/game/engine'
import { calculateCaptaScore, resolveRoomVisit } from '../src/game/scoring'

const players = [
  { id: 'p1', name: 'Raphael' },
  { id: 'p2', name: 'Jessica' },
]

describe('CAPTA SCORE', () => {
  it('rewards delivered couples, Q, sales, VGV and territories', () => {
    const score = calculateCaptaScore({
      deliveredCouples: 3,
      qualifiedCouples: 2,
      sales: 1,
      vgv: 100000,
      territories: 2,
      missions: 1,
      bonuses: 0,
    })

    expect(score).toBe(1540)
  })
})

describe('room resolution', () => {
  it('delivers carried couples and records Q, NQ, sale and VGV', () => {
    const state = createInitialMatch(players)
    state.players.p1.couples = [
      { id: 'c1', status: 'captured', vip: false },
      { id: 'c2', status: 'vip', vip: true },
    ]

    const resolved = resolveRoomVisit(state, 'p1', [
      { coupleId: 'c1', qualified: true, converted: true, vgv: 92000 },
      { coupleId: 'c2', qualified: false, converted: false, vgv: 0 },
    ])

    expect(resolved.players.p1.couples).toHaveLength(0)
    expect(resolved.players.p1.deliveredCouples).toBe(2)
    expect(resolved.players.p1.qualifiedCouples).toBe(1)
    expect(resolved.players.p1.nqCouples).toBe(1)
    expect(resolved.players.p1.sales).toBe(1)
    expect(resolved.players.p1.vgv).toBe(92000)
    expect(resolved.players.p1.score).toBeGreaterThan(0)
  })
})
