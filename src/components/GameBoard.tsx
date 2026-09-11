import type { GamePlayerState, GameTile } from '../game/types'

type GameBoardProps = {
  board: GameTile[]
  players: Record<string, GamePlayerState>
  currentPlayerId: string
  lastRoll: number | null
}

const PERIMETER_POSITIONS = [
  [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6],
  [2, 6], [3, 6], [4, 6], [5, 6], [6, 6],
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1],
  [5, 1], [4, 1], [3, 1], [2, 1],
] as const

const PLAYER_EMOJIS = ['🧢', '⚡', '🔥', '🎯', '🚀', '👑', '🦾', '💎']

export default function GameBoard({ board, players, currentPlayerId, lastRoll }: GameBoardProps) {
  return (
    <section className="city-board" aria-label="Tabuleiro CAPTA CITY">
      {board.map((tile, index) => {
        const [row, column] = PERIMETER_POSITIONS[index] ?? [1, 1]
        const tilePlayers = Object.values(players).filter((player) => player.position === index)
        const ownerId = tile.claimable ? Object.keys(players).find(() => false) : undefined

        return (
          <div
            key={tile.id}
            className={`board-tile board-tile--${tile.type} ${tile.type === 'room' ? 'board-tile--room' : ''}`}
            style={{ gridRow: row, gridColumn: column }}
            data-tile-id={tile.id}
            aria-label={`${tile.name}: ${tile.description}`}
          >
            <span className="tile-emoji" aria-hidden="true">{tile.emoji}</span>
            <strong>{tile.name}</strong>
            {ownerId ? <small>Dono: {players[ownerId]?.name}</small> : null}
            <div className="tile-players" aria-label={`${tilePlayers.length} jogadores nesta casa`}>
              {tilePlayers.map((player, playerIndex) => (
                <span
                  key={player.id}
                  className={`player-token ${player.id === currentPlayerId ? 'player-token--active' : ''}`}
                  title={player.name}
                  aria-label={player.name}
                >
                  {PLAYER_EMOJIS[Object.keys(players).indexOf(player.id) % PLAYER_EMOJIS.length] ?? '🎮'}
                </span>
              ))}
            </div>
          </div>
        )
      })}

      <div className="board-center" style={{ gridRow: '2 / 6', gridColumn: '2 / 6' }}>
        <p className="center-eyebrow">AUREON GAMES</p>
        <h2>CAPTA CITY</h2>
        <p>Leve seus casais até a SALA.</p>
        <div className="center-dice" data-testid="last-roll" aria-live="polite">
          <span aria-hidden="true">🎲</span>
          <strong>{lastRoll ?? '—'}</strong>
        </div>
      </div>
    </section>
  )
}
