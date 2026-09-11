import type { GamePlayerState, GameState } from './types'

export type GameCardDefinition = {
  id: string
  name: string
  emoji: string
  description: string
  target: 'self' | 'opponent' | 'any'
}

export const LAUNCH_CARDS: GameCardDefinition[] = [
  { id: 'uber-sala', name: 'Uber para Sala', emoji: '🚕', description: 'Vá direto para a SALA.', target: 'self' },
  { id: 'casal-duplo', name: 'Casal Duplo', emoji: '👫', description: 'Sua próxima captação rende +1 casal.', target: 'self' },
  { id: 'troca-posicao', name: 'Troca de Posição', emoji: '🔄', description: 'Troque sua posição com outro jogador.', target: 'opponent' },
  { id: 'dia-perfeito', name: 'Dia Perfeito', emoji: '🌟', description: 'Ganhe uma jogada extra.', target: 'self' },
  { id: 'cliente-vip', name: 'Cliente VIP', emoji: '💎', description: 'Transforme um casal carregado em VIP.', target: 'self' },
  { id: 'concorrente', name: 'Concorrente', emoji: '😈', description: 'Pressione um adversário e tente derrubar um casal.', target: 'opponent' },
  { id: 'brinde-extra', name: 'Brinde Extra', emoji: '🎁', description: 'Receba +200 moedas.', target: 'self' },
  { id: 'notour', name: 'Notour', emoji: '👑', description: 'Ganhe um casal especial instantaneamente.', target: 'self' },
  { id: 'escudo', name: 'Escudo', emoji: '🛡️', description: 'Bloqueie o próximo ataque.', target: 'self' },
  { id: 'atalho', name: 'Atalho', emoji: '⚡', description: 'Avance 3 casas.', target: 'self' },
]

function replacePlayer(state: GameState, player: GamePlayerState): GameState {
  return {
    ...state,
    players: {
      ...state.players,
      [player.id]: player,
    },
  }
}

function consumeCard(player: GamePlayerState, cardId: string): GamePlayerState {
  const index = player.cards.indexOf(cardId)
  if (index < 0) {
    throw new Error(`Player does not own card ${cardId}`)
  }

  return {
    ...player,
    cards: player.cards.filter((_, cardIndex) => cardIndex !== index),
  }
}

function requireTarget(state: GameState, actorId: string, targetId?: string): GamePlayerState {
  if (!targetId || targetId === actorId || !state.players[targetId]) {
    throw new Error('This card requires a valid opponent target')
  }
  return state.players[targetId]
}

export function applyCard(
  state: GameState,
  actorId: string,
  cardId: string,
  targetId?: string,
): GameState {
  const actor = state.players[actorId]
  if (!actor) throw new Error(`Player ${actorId} does not exist in this match`)
  if (!LAUNCH_CARDS.some((card) => card.id === cardId)) throw new Error(`Unknown card ${cardId}`)

  let nextActor = consumeCard(actor, cardId)
  let nextState = replacePlayer(state, nextActor)

  switch (cardId) {
    case 'uber-sala': {
      const roomIndex = state.board.findIndex((tile) => tile.type === 'room')
      if (roomIndex < 0) throw new Error('SALA tile is missing from the board')
      nextActor = { ...nextActor, position: roomIndex }
      return replacePlayer(nextState, nextActor)
    }
    case 'casal-duplo':
      return replacePlayer(nextState, { ...nextActor, activeEffects: [...nextActor.activeEffects, 'double-capture'] })
    case 'dia-perfeito':
      return replacePlayer(nextState, { ...nextActor, activeEffects: [...nextActor.activeEffects, 'extra-turn'] })
    case 'cliente-vip': {
      if (nextActor.couples.length === 0) throw new Error('Cliente VIP requires a carried couple')
      const [first, ...rest] = nextActor.couples
      return replacePlayer(nextState, {
        ...nextActor,
        couples: [{ ...first, vip: true, status: 'vip' }, ...rest],
      })
    }
    case 'brinde-extra':
      return replacePlayer(nextState, { ...nextActor, coins: nextActor.coins + 200 })
    case 'notour': {
      if (nextActor.couples.length >= 3) throw new Error('Player is already carrying the maximum number of couples')
      return replacePlayer(nextState, {
        ...nextActor,
        couples: [
          ...nextActor.couples,
          { id: `notour-${state.round}-${actorId}-${nextActor.couples.length + 1}`, status: 'protected', vip: false },
        ],
      })
    }
    case 'escudo':
      return replacePlayer(nextState, { ...nextActor, activeEffects: [...nextActor.activeEffects, 'shield'] })
    case 'atalho':
      return replacePlayer(nextState, { ...nextActor, position: (nextActor.position + 3) % state.board.length })
    case 'troca-posicao': {
      const target = requireTarget(state, actorId, targetId)
      nextState = replacePlayer(nextState, { ...nextActor, position: target.position })
      return replacePlayer(nextState, { ...target, position: actor.position })
    }
    case 'concorrente': {
      const target = requireTarget(state, actorId, targetId)
      const shieldIndex = target.activeEffects.indexOf('shield')
      if (shieldIndex >= 0) {
        return replacePlayer(nextState, {
          ...target,
          activeEffects: target.activeEffects.filter((_, index) => index !== shieldIndex),
        })
      }

      return replacePlayer(nextState, {
        ...target,
        couples: target.couples.slice(0, -1),
      })
    }
    default:
      return nextState
  }
}
