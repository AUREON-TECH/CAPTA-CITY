import type { GameTile } from './types'

export const LAUNCH_BOARD: GameTile[] = [
  { id: 'start', name: 'PRAÇA CENTRAL', type: 'start', emoji: '🚩', description: 'Comece sua rota pela cidade.' },
  { id: 'park', name: 'PARK', type: 'territory', emoji: '🎡', description: 'Ponto forte de captação.', claimable: true },
  { id: 'chance-1', name: 'SORTE', type: 'chance', emoji: '🎁', description: 'Compre uma surpresa da cidade.' },
  { id: 'porta', name: 'PORTA', type: 'territory', emoji: '🚪', description: 'Conquiste a entrada e ganhe bônus.', claimable: true },
  { id: 'couple-1', name: 'CASAL ENCONTRADO', type: 'capture', emoji: '👫', description: 'Encontre um casal para carregar.' },
  { id: 'corridor', name: 'CORREDOR', type: 'territory', emoji: '🏃', description: 'Movimento intenso e novas oportunidades.', claimable: true },
  { id: 'event-1', name: 'EVENTO DA CIDADE', type: 'event', emoji: '🎉', description: 'Um evento global pode mudar a rodada.' },
  { id: 'dream-house', name: 'DREAM HOUSE', type: 'territory', emoji: '🏰', description: 'Território premium de captação.', claimable: true },
  { id: 'mission-1', name: 'MISSÃO RELÂMPAGO', type: 'mission', emoji: '🎯', description: 'Complete uma missão e ganhe score.' },
  { id: 'capivari', name: 'CAPIVARI', type: 'territory', emoji: '🌆', description: 'Região movimentada com alto potencial.', claimable: true },
  { id: 'duel-1', name: 'DUELO', type: 'duel', emoji: '⚔️', description: 'Desafie outro jogador.' },
  { id: 'baden', name: 'BADEN', type: 'territory', emoji: '🍻', description: 'Domine o ponto e cobre bônus.', claimable: true },
  { id: 'bonus-1', name: 'ATALHO', type: 'bonus', emoji: '⚡', description: 'Avance com vantagem.' },
  { id: 'igreja', name: 'IGREJA', type: 'territory', emoji: '⛪', description: 'Ponto estratégico da cidade.', claimable: true },
  { id: 'penalty-1', name: 'CONCORRENTE', type: 'penalty', emoji: '🚨', description: 'Proteja seus casais ou sofra a pressão.' },
  { id: 'roda-gigante', name: 'RODA GIGANTE', type: 'territory', emoji: '🎠', description: 'Território especial com bônus de visita.', claimable: true },
  { id: 'couple-2', name: 'CASAL VIP', type: 'capture', emoji: '💎', description: 'Chance de encontrar um casal VIP.' },
  { id: 'chance-2', name: 'CARTA ESPECIAL', type: 'chance', emoji: '🃏', description: 'Receba uma carta para mudar a partida.' },
  { id: 'room', name: 'SALA', type: 'room', emoji: '🍾', description: 'Resolva Q/NQ, venda e VGV.' },
  { id: 'event-2', name: 'ALTA TEMPORADA', type: 'event', emoji: '🔥', description: 'A cidade inteira entra em ritmo acelerado.' },
]
