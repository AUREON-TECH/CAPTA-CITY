import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('./lib/supabase', () => ({
  captaCityRedirectUrl: () => 'https://aureon-tech.github.io/CAPTA-CITY/',
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

import App from './App'

describe('CAPTA CITY shell', () => {
  it('shows the Ludo game and Google sign-in entry', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: /capta city/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar com google/i })).toBeInTheDocument()
    expect(screen.getByText(/ludo da captação/i)).toBeInTheDocument()
  })
})
