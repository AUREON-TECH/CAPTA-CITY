import { useState } from 'react'
import { captaCityRedirectUrl, supabase } from '../../lib/supabase'

export default function LoginScreen() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function signInWithGoogle() {
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: captaCityRedirectUrl(),
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-logo" aria-hidden="true">🎲</div>
        <p className="eyebrow">AUREON GAMES</p>
        <h1 id="auth-title">CAPTA CITY</h1>
        <p className="auth-kicker">LUDO DA CAPTAÇÃO</p>
        <p className="auth-copy">
          Entre com sua conta Google, leve seus casais até a SALA e dispute partidas online contra mais três jogadores.
        </p>

        <button className="google-login" type="button" onClick={signInWithGoogle} disabled={loading}>
          <span aria-hidden="true">G</span>
          <strong>{loading ? 'ABRINDO GOOGLE…' : 'ENTRAR COM GOOGLE'}</strong>
        </button>

        {error ? <p className="auth-error" role="alert">{error}</p> : null}

        <div className="auth-features" aria-label="Recursos do CAPTA CITY">
          <span>🎲 Ludo 4 jogadores</span>
          <span>👫 4 casais por jogador</span>
          <span>🍾 Venda + VGV</span>
          <span>🏆 Ranking online</span>
        </div>
      </section>
    </main>
  )
}
