import { useState } from 'react'
import MatchScreen from './features/match/MatchScreen'
import './styles.css'

type Screen = 'home' | 'create' | 'join' | 'match'

const DEMO_PLAYERS = [
  { id: 'p1', name: 'Raphael' },
  { id: 'p2', name: 'Jessica' },
  { id: 'p3', name: 'Pedro' },
  { id: 'p4', name: 'Josy' },
]

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')

  if (screen === 'match') {
    return <MatchScreen players={DEMO_PLAYERS} onExit={() => setScreen('home')} />
  }

  return (
    <main className="app-shell">
      <section className="hero-card" aria-labelledby="game-title">
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true">🎲</div>
          <div>
            <p className="eyebrow">AUREON GAMES</p>
            <h1 id="game-title">CAPTA CITY</h1>
          </div>
          <span className="status-pill">V1 • EM CONSTRUÇÃO</span>
        </div>

        <div className="hero-copy">
          <p className="kicker">O JOGO DA CAPTAÇÃO</p>
          <h2>Conquiste pontos. Leve casais. Domine a cidade.</h2>
          <p className="subtitle">
            Rode os dados, atravesse a cidade, carregue casais até a Sala e transforme cada jogada em Q, venda e VGV.
          </p>
        </div>

        {screen === 'home' && (
          <div className="action-grid" aria-label="Ações da partida">
            <button className="primary-action" type="button" onClick={() => setScreen('create')}>
              <span className="action-icon" aria-hidden="true">⚡</span>
              <span><strong>Criar sala</strong><small>Começar uma nova partida</small></span>
            </button>
            <button className="secondary-action" type="button" onClick={() => setScreen('join')}>
              <span className="action-icon" aria-hidden="true">🔑</span>
              <span><strong>Entrar em sala</strong><small>Usar um código de convite</small></span>
            </button>
          </div>
        )}

        {screen === 'create' && (
          <div className="panel" role="region" aria-label="Criar sala">
            <p className="panel-label">NOVA PARTIDA</p>
            <h3>Sua cidade está pronta.</h3>
            <p>A versão atual já permite testar o tabuleiro, rodar dados, coletar casais, chegar à SALA, gerar VGV e disputar o ranking. O código de sala online entra na próxima camada com Supabase.</p>
            <div className="panel-actions">
              <button type="button" className="play-demo-action" onClick={() => setScreen('match')}>🎮 JOGAR VERSÃO ATUAL</button>
              <button type="button" className="ghost-action" onClick={() => setScreen('home')}>Voltar</button>
            </div>
          </div>
        )}

        {screen === 'join' && (
          <div className="panel" role="region" aria-label="Entrar em sala">
            <label htmlFor="room-code">Código da sala</label>
            <input id="room-code" name="room-code" inputMode="text" maxLength={8} placeholder="EX: CITY77" disabled aria-describedby="room-note" />
            <p id="room-note">O multiplayer online será ativado quando conectarmos o Supabase dedicado do CAPTA CITY.</p>
            <button type="button" className="ghost-action" onClick={() => setScreen('home')}>Voltar</button>
          </div>
        )}

        <div className="feature-strip" aria-label="Destaques do jogo">
          <div><span>👫</span><strong>CASAIS</strong><small>Leve até a Sala</small></div>
          <div><span>🏙️</span><strong>TERRITÓRIOS</strong><small>Domine pontos</small></div>
          <div><span>🍾</span><strong>VENDAS</strong><small>Gere VGV</small></div>
          <div><span>🏆</span><strong>RANKING</strong><small>Seja o nº 1</small></div>
        </div>
      </section>
    </main>
  )
}
