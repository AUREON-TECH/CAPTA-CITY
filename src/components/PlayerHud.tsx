import type { GamePlayerState } from '../game/types'

type PlayerHudProps = {
  player: GamePlayerState
  tileName: string
}

export default function PlayerHud({ player, tileName }: PlayerHudProps) {
  return (
    <aside className="player-hud" aria-label="Seus indicadores">
      <div className="hud-title">
        <div>
          <span className="hud-kicker">SUA JOGADA</span>
          <h3>{player.name}</h3>
        </div>
        <span className="location-chip">📍 {tileName}</span>
      </div>

      <div className="hud-stats">
        <div>
          <span>👫 CASAIS</span>
          <strong data-testid="couples-count">{player.couples.length} / 3</strong>
        </div>
        <div>
          <span>🪙 MOEDAS</span>
          <strong>{player.coins}</strong>
        </div>
        <div>
          <span>🍾 VENDAS</span>
          <strong>{player.sales}</strong>
        </div>
        <div>
          <span>💰 VGV</span>
          <strong>{player.vgv.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</strong>
        </div>
      </div>

      <div className="hud-footer">
        <span>CAPTA SCORE</span>
        <strong>{player.score.toLocaleString('pt-BR')} pts</strong>
      </div>
    </aside>
  )
}
