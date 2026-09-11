import type { GamePlayerState } from '../game/types'

type LiveRankingProps = {
  players: Record<string, GamePlayerState>
}

export default function LiveRanking({ players }: LiveRankingProps) {
  const ranked = Object.values(players).sort((a, b) =>
    b.score - a.score || b.sales - a.sales || b.vgv - a.vgv,
  )

  return (
    <aside className="live-ranking" data-testid="live-ranking" aria-label="Ranking ao vivo">
      <div className="ranking-heading">
        <span>🏆</span>
        <div>
          <small>AO VIVO</small>
          <h3>RANKING</h3>
        </div>
      </div>
      <ol>
        {ranked.map((player, index) => (
          <li key={player.id}>
            <span className="rank-position">{index + 1}º</span>
            <span className="rank-name">{player.name}</span>
            <strong>{player.score.toLocaleString('pt-BR')}</strong>
          </li>
        ))}
      </ol>
    </aside>
  )
}
