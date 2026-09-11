export type TileType =
  | 'start'
  | 'capture'
  | 'territory'
  | 'room'
  | 'event'
  | 'chance'
  | 'mission'
  | 'bonus'
  | 'penalty'
  | 'duel'

export type CoupleStatus =
  | 'captured'
  | 'protected'
  | 'vip'
  | 'qualified'
  | 'nq'
  | 'delivered'
  | 'converted'
  | 'lost'

export type MatchStatus = 'waiting' | 'playing' | 'finished'

export type PlayerInput = {
  id: string
  name: string
}

export type GameTile = {
  id: string
  name: string
  type: TileType
  emoji: string
  description: string
  claimable?: boolean
}

export type GameCouple = {
  id: string
  status: CoupleStatus
  vip: boolean
}

export type GamePlayerState = {
  id: string
  name: string
  position: number
  couples: GameCouple[]
  deliveredCouples: number
  qualifiedCouples: number
  nqCouples: number
  coins: number
  vgv: number
  sales: number
  score: number
  cards: string[]
  activeEffects: string[]
  skippedTurns: number
}

export type GameState = {
  round: number
  maxRounds: number
  currentPlayerId: string
  turnOrder: string[]
  players: Record<string, GamePlayerState>
  board: GameTile[]
  territories: Record<string, string>
  events: string[]
  status: MatchStatus
}
