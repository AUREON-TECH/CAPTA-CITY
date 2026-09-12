import { CAPTA_SAFE_CELLS, getSharedCell, type LudoColor, type LudoPiece, type LudoState } from '../game/ludo'

type LudoBoardProps = {
  state: LudoState
  movablePieceIds: string[]
  onSelectPiece: (pieceId: string) => void
  currentUserId: string
}

type Point = readonly [number, number]

const TRACK: Point[] = [
  [6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],
  [8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],
  [13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0],
]

const HOME_LANES: Record<LudoColor, Point[]> = {
  red: [[7,1],[7,2],[7,3],[7,4],[7,5]],
  blue: [[1,7],[2,7],[3,7],[4,7],[5,7]],
  green: [[7,13],[7,12],[7,11],[7,10],[7,9]],
  yellow: [[13,7],[12,7],[11,7],[10,7],[9,7]],
}

const CAPTA_LABELS: Record<number, string> = {
  3: '⚡', 5: 'Q', 8: '🍾', 11: 'NQ',
  16: '⚡', 18: 'Q', 21: '🍾', 24: 'NQ',
  29: '⚡', 31: 'Q', 34: '🍾', 37: 'NQ',
  42: '⚡', 44: 'Q', 47: '🍾', 50: 'NQ',
}

const COLOR_NAMES: Record<LudoColor, string> = {
  red: 'Vermelho', blue: 'Azul', green: 'Verde', yellow: 'Amarelo',
}

function piecesAtSharedCell(state: LudoState, cell: number) {
  return Object.values(state.players).flatMap((player) =>
    player.pieces
      .filter((piece) => piece.progress >= 0 && piece.progress <= 51 && getSharedCell(player.color, piece.progress) === cell)
      .map((piece) => ({ piece, playerId: player.id, color: player.color })),
  )
}

function piecesAtHomeLane(state: LudoState, color: LudoColor, laneIndex: number) {
  const player = Object.values(state.players).find((item) => item.color === color)
  if (!player) return []
  return player.pieces.filter((piece) => piece.progress === 52 + laneIndex).map((piece) => ({ piece, playerId: player.id, color }))
}

function Token({
  piece,
  color,
  movable,
  onSelect,
}: {
  piece: LudoPiece
  color: LudoColor
  movable: boolean
  onSelect: () => void
}) {
  const casalNumber = piece.id.split('-c').at(-1) ?? '1'
  return (
    <button
      type="button"
      className={`ludo-token ludo-token--${color} ${movable ? 'ludo-token--movable' : ''}`}
      disabled={!movable}
      onClick={onSelect}
      aria-label={`Mover casal ${casalNumber} ${COLOR_NAMES[color]}`}
      title={`Casal ${casalNumber}`}
    >
      <span aria-hidden="true">👫</span>
    </button>
  )
}

export default function LudoBoard({ state, movablePieceIds, onSelectPiece, currentUserId }: LudoBoardProps) {
  const movable = new Set(movablePieceIds)

  return (
    <section className="ludo-board" aria-label="Tabuleiro Ludo CAPTA CITY">
      <div className="ludo-base ludo-base--red" aria-label="Base vermelha">
        <strong>VERMELHO</strong>
        <div className="base-pieces">
          {Object.values(state.players).find((player) => player.color === 'red')?.pieces.filter((piece) => piece.progress === -1).map((piece) => (
            <Token key={piece.id} piece={piece} color="red" movable={movable.has(piece.id)} onSelect={() => onSelectPiece(piece.id)} />
          ))}
        </div>
      </div>
      <div className="ludo-base ludo-base--blue" aria-label="Base azul">
        <strong>AZUL</strong>
        <div className="base-pieces">
          {Object.values(state.players).find((player) => player.color === 'blue')?.pieces.filter((piece) => piece.progress === -1).map((piece) => (
            <Token key={piece.id} piece={piece} color="blue" movable={movable.has(piece.id)} onSelect={() => onSelectPiece(piece.id)} />
          ))}
        </div>
      </div>
      <div className="ludo-base ludo-base--green" aria-label="Base verde">
        <strong>VERDE</strong>
        <div className="base-pieces">
          {Object.values(state.players).find((player) => player.color === 'green')?.pieces.filter((piece) => piece.progress === -1).map((piece) => (
            <Token key={piece.id} piece={piece} color="green" movable={movable.has(piece.id)} onSelect={() => onSelectPiece(piece.id)} />
          ))}
        </div>
      </div>
      <div className="ludo-base ludo-base--yellow" aria-label="Base amarela">
        <strong>AMARELO</strong>
        <div className="base-pieces">
          {Object.values(state.players).find((player) => player.color === 'yellow')?.pieces.filter((piece) => piece.progress === -1).map((piece) => (
            <Token key={piece.id} piece={piece} color="yellow" movable={movable.has(piece.id)} onSelect={() => onSelectPiece(piece.id)} />
          ))}
        </div>
      </div>

      {TRACK.map(([row, col], cell) => {
        const occupants = piecesAtSharedCell(state, cell)
        return (
          <div
            key={`track-${cell}`}
            className={`ludo-cell ${CAPTA_SAFE_CELLS.has(cell) ? 'ludo-cell--safe' : ''}`}
            style={{ gridRow: row + 1, gridColumn: col + 1 }}
            aria-label={`Casa ${cell + 1}${CAPTA_SAFE_CELLS.has(cell) ? ', segura' : ''}`}
          >
            <small>{CAPTA_LABELS[cell] ?? (CAPTA_SAFE_CELLS.has(cell) ? '★' : '')}</small>
            <div className="cell-tokens">
              {occupants.map(({ piece, color }) => (
                <Token key={piece.id} piece={piece} color={color} movable={movable.has(piece.id)} onSelect={() => onSelectPiece(piece.id)} />
              ))}
            </div>
          </div>
        )
      })}

      {(Object.keys(HOME_LANES) as LudoColor[]).flatMap((color) =>
        HOME_LANES[color].map(([row, col], laneIndex) => {
          const occupants = piecesAtHomeLane(state, color, laneIndex)
          return (
            <div key={`${color}-home-${laneIndex}`} className={`ludo-cell ludo-home ludo-home--${color}`} style={{ gridRow: row + 1, gridColumn: col + 1 }}>
              <small>{laneIndex === 4 ? 'SALA' : '→'}</small>
              <div className="cell-tokens">
                {occupants.map(({ piece }) => (
                  <Token key={piece.id} piece={piece} color={color} movable={movable.has(piece.id)} onSelect={() => onSelectPiece(piece.id)} />
                ))}
              </div>
            </div>
          )
        }),
      )}

      <div className="ludo-center" style={{ gridRow: 7, gridColumn: 7, gridRowEnd: 10, gridColumnEnd: 10 }}>
        <span>🏁</span>
        <strong>SALA</strong>
        <small>4 casais</small>
        <div className="finished-tokens">
          {Object.values(state.players).flatMap((player) => player.pieces.filter((piece) => piece.progress === 57).map((piece) => (
            <span key={piece.id} className={`finished-dot finished-dot--${player.color}`} title={`${player.name}: casal entregue`}>●</span>
          )))}
        </div>
      </div>

      <div className="board-turn-label" aria-live="polite">
        {state.winnerId ? '🏆 PARTIDA ENCERRADA' : state.currentPlayerId === currentUserId ? 'SUA VEZ' : `VEZ DE ${state.players[state.currentPlayerId]?.name ?? 'JOGADOR'}`}
      </div>
    </section>
  )
}
