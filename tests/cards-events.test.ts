import { describe, expect, it } from 'vitest'
import { createInitialMatch } from '../src/game/engine'
import { applyCard, LAUNCH_CARDS } from '../src/game/cards'
import { applyGlobalEvent, GLOBAL_EVENTS } from '../src/game/events'
import { claimTerritory } from '../src/game/territories'

const players = [
  { id: 'p1', name: 'Raphael' },
  { id: 'p2', name: 'Jessica' },
]

describe('special cards', () => {
  it('ships with at least ten launch cards', () => {
    expect(LAUNCH_CARDS.length).toBeGreaterThanOrEqual(10)
  })

  it('Uber para Sala moves the player directly to SALA and consumes the card', () => {
    const state = createInitialMatch(players)
    state.players.p1.position = 3
    state.players.p1.cards = ['uber-sala']

    const next = applyCard(state, 'p1', 'uber-sala')
    const roomIndex = next.board.findIndex((tile) => tile.type === 'room')

    expect(next.players.p1.position).toBe(roomIndex)
    expect(next.players.p1.cards).not.toContain('uber-sala')
  })

  it('Cliente VIP upgrades a carried couple', () => {
    const state = createInitialMatch(players)
    state.players.p1.cards = ['cliente-vip']
    state.players.p1.couples = [{ id: 'c1', status: 'captured', vip: false }]

    const next = applyCard(state, 'p1', 'cliente-vip')

    expect(next.players.p1.couples[0].vip).toBe(true)
    expect(next.players.p1.couples[0].status).toBe('vip')
  })

  it('Casal Duplo and Escudo create temporary player effects', () => {
    const state = createInitialMatch(players)
    state.players.p1.cards = ['casal-duplo', 'escudo']

    const doubled = applyCard(state, 'p1', 'casal-duplo')
    const shielded = applyCard(doubled, 'p1', 'escudo')

    expect(shielded.players.p1.activeEffects).toContain('double-capture')
    expect(shielded.players.p1.activeEffects).toContain('shield')
  })

  it('Atalho advances three spaces', () => {
    const state = createInitialMatch(players)
    state.players.p1.cards = ['atalho']

    const next = applyCard(state, 'p1', 'atalho')

    expect(next.players.p1.position).toBe(3)
  })
})

describe('territories', () => {
  it('lets a player claim a claimable tile by paying coins', () => {
    const state = createInitialMatch(players)
    const tileIndex = state.board.findIndex((tile) => tile.id === 'park')
    state.players.p1.position = tileIndex

    const next = claimTerritory(state, 'p1', 'park')

    expect(next.territories.park).toBe('p1')
    expect(next.players.p1.coins).toBeLessThan(state.players.p1.coins)
  })
})

describe('global events', () => {
  it('ships with at least six city events and activates one globally', () => {
    expect(GLOBAL_EVENTS.length).toBeGreaterThanOrEqual(6)

    const state = createInitialMatch(players)
    const next = applyGlobalEvent(state, 'capivari-lotado')

    expect(next.events).toContain('capivari-lotado')
  })
})
