import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createInitialMatch } from '../src/game/engine'
import MatchScreen from '../src/features/match/MatchScreen'

const demoPlayers = [
  { id: 'p1', name: 'Raphael' },
  { id: 'p2', name: 'Jessica' },
  { id: 'p3', name: 'Pedro' },
  { id: 'p4', name: 'Josy' },
]

describe('CAPTA CITY match screen', () => {
  it('renders the city board with real game locations', () => {
    render(<MatchScreen players={demoPlayers} diceRoll={() => 4} />)

    expect(screen.getByText('PARK')).toBeInTheDocument()
    expect(screen.getByText('PORTA')).toBeInTheDocument()
    expect(screen.getByText('CORREDOR')).toBeInTheDocument()
    expect(screen.getByText('CAPIVARI')).toBeInTheDocument()
    expect(screen.getByText('SALA')).toBeInTheDocument()
  })

  it('rolls the dice, moves the player and captures a couple on a capture tile', () => {
    render(<MatchScreen players={demoPlayers} diceRoll={() => 4} />)

    fireEvent.click(screen.getByRole('button', { name: /rodar dados/i }))

    expect(screen.getByTestId('last-roll')).toHaveTextContent('4')
    expect(screen.getByTestId('player-p1-position')).toHaveTextContent('4')
    expect(screen.getByTestId('couples-count')).toHaveTextContent('1 / 3')
  })

  it('orders the live ranking by CAPTA SCORE', () => {
    const state = createInitialMatch(demoPlayers)
    state.players.p1.score = 120
    state.players.p2.score = 980
    state.players.p3.score = 430

    render(<MatchScreen players={demoPlayers} initialState={state} diceRoll={() => 2} />)

    const ranking = screen.getByTestId('live-ranking')
    const rows = within(ranking).getAllByRole('listitem')

    expect(rows[0]).toHaveTextContent('Jessica')
    expect(rows[1]).toHaveTextContent('Pedro')
    expect(rows[2]).toHaveTextContent('Raphael')
  })
})
