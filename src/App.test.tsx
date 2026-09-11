import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('CAPTA CITY shell', () => {
  it('shows the game title and play actions', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /capta city/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /criar sala/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar em sala/i })).toBeInTheDocument()
  })
})
