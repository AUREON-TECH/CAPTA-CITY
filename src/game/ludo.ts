export type LudoColor = 'red' | 'blue' | 'green' | 'yellow'
export type LudoStatus = 'playing' | 'finished'

export type LudoPlayerInput = {
  id: string
  name: string
  avatarUrl?: string | null
}

export type LudoPiece = {
  id: string
  progress: number
}

export type LudoPlayerState = {
  id: string
  name: string
  avatarUrl?: string | null
  color: LudoColor
  pieces: LudoPiece[]
  deliveredCouples: number
  qualifiedCouples: number
  nqCouples: number
  sales: number
  vgv: number
  coins: number
  score: number
}

export type LudoEvent = {
  kind: 'q' | 'nq' | 'sale' | 'bonus' | 'delivered'
  message: string
  value?: number
}

export type LudoState = {
  status: LudoStatus
  turnOrder: string[]
  currentPlayerId: string
  players: Record<string, LudoPlayerState>
  round: number
  winnerId: string | null
  lastRoll: number | null
  lastEvent: LudoEvent | null
  revision: number
}

export type LudoMoveResult = {
  state: LudoState
  capturedPieceIds: string[]
  event: LudoEvent | null
}

export const LUDO_COLORS: LudoColor[] = ['red', 'blue', 'green', 'yellow']

export const COLOR_START_OFFSETS: Record<LudoColor, number> = {
  red: 0,
  blue: 13,
  green: 26,
  yellow: 39,
}

export const CAPTA_SAFE_CELLS = new Set([0, 8, 13, 21, 26, 34, 39, 47])

const Q_CELLS = new Set([5, 18, 31, 44])
const NQ_CELLS = new Set([11, 24, 37, 50])
const SALE_CELLS = new Set([8, 21, 34, 47])
const BONUS_CELLS = new Set([3, 16, 29, 42])

function createPieces(playerId: string): LudoPiece[] {
  return Array.from({ length: 4 }, (_, index) => ({
    id: `${playerId}-c${index + 1}`,
    progress: -1,
  }))
}

function cloneState(state: LudoState): LudoState {
  return {
    ...state,
    turnOrder: [...state.turnOrder],
    players: Object.fromEntries(
      Object.entries(state.players).map(([id, player]) => [
        id,
        { ...player, pieces: player.pieces.map((piece) => ({ ...piece })) },
      ]),
    ),
    lastEvent: state.lastEvent ? { ...state.lastEvent } : null,
  }
}

export function createLudoMatch(players: LudoPlayerInput[]): LudoState {
  if (players.length !== 4) {
    throw new Error('CAPTA CITY Ludo requires exactly four players')
  }

  const uniqueIds = new Set(players.map((player) => player.id))
  if (uniqueIds.size !== 4) {
    throw new Error('CAPTA CITY Ludo requires four unique players')
  }

  const playerMap = Object.fromEntries(
    players.map((player, index) => {
      const color = LUDO_COLORS[index]
      return [
        player.id,
        {
          id: player.id,
          name: player.name,
          avatarUrl: player.avatarUrl ?? null,
          color,
          pieces: createPieces(player.id),
          deliveredCouples: 0,
          qualifiedCouples: 0,
          nqCouples: 0,
          sales: 0,
          vgv: 0,
          coins: 0,
          score: 0,
        } satisfies LudoPlayerState,
      ]
    }),
  )

  return {
    status: 'playing',
    turnOrder: players.map((player) => player.id),
    currentPlayerId: players[0].id,
    players: playerMap,
    round: 1,
    winnerId: null,
    lastRoll: null,
    lastEvent: null,
    revision: 0,
  }
}

export function getSharedCell(color: LudoColor, progress: number): number {
  return (COLOR_START_OFFSETS[color] + progress) % 52
}

export function getMovablePieceIds(state: LudoState, playerId: string, roll: number): string[] {
  if (state.status !== 'playing' || state.currentPlayerId !== playerId) return []
  if (!Number.isInteger(roll) || roll < 1 || roll > 6) return []

  const player = state.players[playerId]
  if (!player) return []

  return player.pieces
    .filter((piece) => {
      if (piece.progress === 57) return false
      if (piece.progress === -1) return roll === 6
      return piece.progress + roll <= 57
    })
    .map((piece) => piece.id)
}

function resolveCaptaEvent(player: LudoPlayerState, globalCell: number): LudoEvent | null {
  if (Q_CELLS.has(globalCell)) {
    player.qualifiedCouples += 1
    player.score += 150
    return { kind: 'q', message: '✅ Q! Casal qualificado: +150 CAPTA SCORE.' }
  }

  if (NQ_CELLS.has(globalCell)) {
    player.nqCouples += 1
    player.score = Math.max(0, player.score - 50)
    return { kind: 'nq', message: '⚪ NQ. -50 CAPTA SCORE.' }
  }

  if (SALE_CELLS.has(globalCell)) {
    const vgv = 75000
    player.sales += 1
    player.vgv += vgv
    player.score += 575
    return { kind: 'sale', message: '🍾 VENDA! +R$ 75 mil de VGV.', value: vgv }
  }

  if (BONUS_CELLS.has(globalCell)) {
    player.coins += 100
    player.score += 100
    return { kind: 'bonus', message: '⚡ BÔNUS! +100 moedas e +100 pontos.', value: 100 }
  }

  return null
}

function advanceTurn(state: LudoState, roll: number) {
  if (state.status === 'finished' || roll === 6) return

  const currentIndex = state.turnOrder.indexOf(state.currentPlayerId)
  const nextIndex = (currentIndex + 1) % state.turnOrder.length
  state.currentPlayerId = state.turnOrder[nextIndex]
  if (nextIndex === 0) state.round += 1
}

export function moveLudoPiece(
  state: LudoState,
  playerId: string,
  pieceId: string,
  roll: number,
): LudoMoveResult {
  if (state.status !== 'playing') throw new Error('This CAPTA CITY match is finished')
  if (state.currentPlayerId !== playerId) throw new Error('It is not this player’s turn')

  const movable = getMovablePieceIds(state, playerId, roll)
  if (!movable.includes(pieceId)) {
    throw new Error('This casal cannot move with the current roll')
  }

  const next = cloneState(state)
  const player = next.players[playerId]
  const piece = player.pieces.find((item) => item.id === pieceId)
  if (!piece) throw new Error('Casal piece not found')

  piece.progress = piece.progress === -1 ? 0 : piece.progress + roll
  const capturedPieceIds: string[] = []
  let event: LudoEvent | null = null

  if (piece.progress >= 0 && piece.progress <= 51) {
    const destination = getSharedCell(player.color, piece.progress)

    if (!CAPTA_SAFE_CELLS.has(destination)) {
      for (const opponent of Object.values(next.players)) {
        if (opponent.id === playerId) continue
        for (const opponentPiece of opponent.pieces) {
          if (opponentPiece.progress < 0 || opponentPiece.progress > 51) continue
          if (getSharedCell(opponent.color, opponentPiece.progress) === destination) {
            opponentPiece.progress = -1
            capturedPieceIds.push(opponentPiece.id)
            player.score += 100
          }
        }
      }
    }

    event = resolveCaptaEvent(player, destination)
  }

  if (piece.progress === 57) {
    player.deliveredCouples = player.pieces.filter((item) => item.progress === 57).length
    player.score += 250
    event = { kind: 'delivered', message: '🏁 Casal entregue na SALA! +250 pontos.' }

    if (player.deliveredCouples === 4) {
      next.status = 'finished'
      next.winnerId = playerId
    }
  }

  next.lastRoll = roll
  next.lastEvent = event
  next.revision += 1
  advanceTurn(next, roll)

  return { state: next, capturedPieceIds, event }
}

export function skipLudoTurn(state: LudoState, playerId: string, roll: number): LudoState {
  if (state.currentPlayerId !== playerId) throw new Error('It is not this player’s turn')
  if (getMovablePieceIds(state, playerId, roll).length > 0) {
    throw new Error('A legal casal move is available')
  }

  const next = cloneState(state)
  next.lastRoll = roll
  next.lastEvent = null
  next.revision += 1
  advanceTurn(next, roll === 6 ? 1 : roll)
  return next
}
