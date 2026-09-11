import type { GameState } from './types'

export type CaptaScoreInput = {
  deliveredCouples: number
  qualifiedCouples: number
  sales: number
  vgv: number
  territories: number
  missions: number
  bonuses: number
}

export type RoomOutcome = {
  coupleId: string
  qualified: boolean
  converted: boolean
  vgv: number
}

export const SCORE_RULES = {
  deliveredCouple: 100,
  qualifiedCouple: 150,
  sale: 500,
  territory: 120,
  mission: 200,
  vgvDivider: 1000,
} as const

export function calculateCaptaScore(input: CaptaScoreInput): number {
  return (
    input.deliveredCouples * SCORE_RULES.deliveredCouple +
    input.qualifiedCouples * SCORE_RULES.qualifiedCouple +
    input.sales * SCORE_RULES.sale +
    Math.floor(input.vgv / SCORE_RULES.vgvDivider) +
    input.territories * SCORE_RULES.territory +
    input.missions * SCORE_RULES.mission +
    input.bonuses
  )
}

export function resolveRoomVisit(
  state: GameState,
  playerId: string,
  outcomes: RoomOutcome[],
): GameState {
  const player = state.players[playerId]

  if (!player) {
    throw new Error(`Player ${playerId} does not exist in this match`)
  }

  const carriedIds = new Set(player.couples.map((couple) => couple.id))
  const outcomeIds = new Set(outcomes.map((outcome) => outcome.coupleId))

  if (outcomes.length !== player.couples.length || outcomeIds.size !== outcomes.length) {
    throw new Error('Room resolution must contain one unique outcome per carried couple')
  }

  for (const outcome of outcomes) {
    if (!carriedIds.has(outcome.coupleId)) {
      throw new Error(`Couple ${outcome.coupleId} is not carried by this player`)
    }

    if (outcome.converted && !outcome.qualified) {
      throw new Error('A non-qualified couple cannot be converted')
    }

    if (!Number.isFinite(outcome.vgv) || outcome.vgv < 0) {
      throw new Error('VGV must be a non-negative number')
    }

    if (!outcome.converted && outcome.vgv !== 0) {
      throw new Error('Only converted couples can generate VGV')
    }
  }

  const delivered = outcomes.length
  const qualified = outcomes.filter((outcome) => outcome.qualified).length
  const nq = delivered - qualified
  const sales = outcomes.filter((outcome) => outcome.converted).length
  const vgv = outcomes.reduce((total, outcome) => total + outcome.vgv, 0)
  const territories = Object.values(state.territories).filter((ownerId) => ownerId === playerId).length

  const nextPlayer = {
    ...player,
    couples: [],
    deliveredCouples: player.deliveredCouples + delivered,
    qualifiedCouples: player.qualifiedCouples + qualified,
    nqCouples: player.nqCouples + nq,
    sales: player.sales + sales,
    vgv: player.vgv + vgv,
  }

  nextPlayer.score = calculateCaptaScore({
    deliveredCouples: nextPlayer.deliveredCouples,
    qualifiedCouples: nextPlayer.qualifiedCouples,
    sales: nextPlayer.sales,
    vgv: nextPlayer.vgv,
    territories,
    missions: 0,
    bonuses: 0,
  })

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: nextPlayer,
    },
  }
}
