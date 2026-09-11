import type { GameState } from './types'

export type GlobalEventDefinition = {
  id: string
  name: string
  emoji: string
  durationRounds: number
  description: string
}

export const GLOBAL_EVENTS: GlobalEventDefinition[] = [
  { id: 'capivari-lotado', name: 'Capivari Lotado', emoji: '🌆', durationRounds: 2, description: 'Capivari ganha chance extra de casal.' },
  { id: 'chuva-em-campos', name: 'Chuva em Campos', emoji: '🌧️', durationRounds: 2, description: 'PARK recebe bônus temporário.' },
  { id: 'evento-na-cidade', name: 'Evento na Cidade', emoji: '🎉', durationRounds: 2, description: 'Territórios selecionados valem pontos extras.' },
  { id: 'fiscalizacao', name: 'Fiscalização', emoji: '🚨', durationRounds: 1, description: 'Brindes ficam bloqueados por uma rodada.' },
  { id: 'alta-temporada', name: 'Alta Temporada', emoji: '🔥', durationRounds: 2, description: 'A chance de casal VIP aumenta.' },
  { id: 'noite-de-vendas', name: 'Noite de Vendas', emoji: '🍾', durationRounds: 2, description: 'Vendas geram bônus de VGV virtual.' },
]

export function applyGlobalEvent(state: GameState, eventId: string): GameState {
  if (!GLOBAL_EVENTS.some((event) => event.id === eventId)) {
    throw new Error(`Unknown global event ${eventId}`)
  }

  if (state.events.includes(eventId)) return state

  return {
    ...state,
    events: [...state.events, eventId],
  }
}
