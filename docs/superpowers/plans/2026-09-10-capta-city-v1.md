# CAPTA CITY V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first playable CAPTA CITY release as a mobile-first multiplayer board game where 2–8 players join by room code, roll dice, move, collect couples, reach the Room, resolve Q/NQ/sales/VGV, claim territories, use cards, and finish on a synchronized podium.

**Architecture:** React + Vite + TypeScript frontend organized by game domain, Supabase as the dedicated backend, Postgres for persistent state, private Realtime Broadcast/Presence for room synchronization, and trusted server/database actions for dice, card draws, qualification, conversion, VGV, scoring, and turn advancement. Start with a single launch map and a deterministic game engine that can be tested without the UI.

**Tech Stack:** React, Vite, TypeScript, Tailwind CSS, Vitest, React Testing Library, Supabase Auth/Postgres/Realtime, PWA support, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-10-capta-city-design.md`

## Global Constraints

- Mobile-first experience.
- 2–8 players per online room.
- Target match duration: 10–20 minutes.
- 12 rounds by default.
- Real-world performance unlocks rewards/light perks but must never directly determine a match winner.
- The client must not control authoritative random outcomes.
- RLS must be enabled on all exposed Supabase tables.
- No service-role key may be exposed in the frontend.
- The UI must feel like a playful game, not a CRM/dashboard.
- Full 3D engine, voice chat, complex minigames, real-money marketplace, public matchmaking, and dozens of maps are explicitly out of V1 scope.

---

## File Structure

```text
CAPTA-CITY/
├─ index.html
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ styles.css
│  ├─ lib/
│  │  └─ supabase.ts
│  ├─ game/
│  │  ├─ types.ts
│  │  ├─ constants.ts
│  │  ├─ board.ts
│  │  ├─ engine.ts
│  │  ├─ scoring.ts
│  │  ├─ cards.ts
│  │  └─ events.ts
│  ├─ features/
│  │  ├─ auth/
│  │  ├─ lobby/
│  │  ├─ match/
│  │  ├─ progression/
│  │  └─ rewards/
│  └─ components/
│     ├─ GameBoard.tsx
│     ├─ DiceButton.tsx
│     ├─ PlayerHud.tsx
│     ├─ LiveRanking.tsx
│     └─ EventBanner.tsx
├─ tests/
│  ├─ game-engine.test.ts
│  ├─ scoring.test.ts
│  └─ lobby.test.tsx
├─ public/
│  ├─ manifest.webmanifest
│  └─ icons/
└─ supabase/
   ├─ migrations/
   └─ functions/
```

---

### Task 1: Create a real runnable web app

**Files:**
- Replace: `index.html`
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `README.md`
- Create: `tests/smoke.test.tsx`

**Interfaces:**
- Produces a working Vite entry point and a visible CAPTA CITY home screen.
- Later tasks build on `src/App.tsx` and the test runner established here.

- [ ] **Step 1: Write a failing smoke test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../src/App'

describe('CAPTA CITY shell', () => {
  it('shows the game title and play actions', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /capta city/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /criar sala/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar em sala/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm test -- --run tests/smoke.test.tsx`

Expected: FAIL because the app files do not exist yet.

- [ ] **Step 3: Implement the minimal shell**

`src/App.tsx` should render a game landing screen with the title `CAPTA CITY`, tagline `Conquiste pontos. Leve casais. Domine a cidade.`, and working `Criar sala` / `Entrar em sala` actions that switch local views without reload.

- [ ] **Step 4: Run test and build**

Run:

```bash
npm test -- --run
npm run build
```

Expected: all tests PASS and Vite build succeeds.

- [ ] **Step 5: Commit**

```bash
git add index.html package.json vite.config.ts tsconfig.json src tests README.md
git commit -m "feat: bootstrap playable CAPTA CITY shell"
```

---

### Task 2: Build the deterministic game model and launch board

**Files:**
- Create: `src/game/types.ts`
- Create: `src/game/constants.ts`
- Create: `src/game/board.ts`
- Create: `src/game/engine.ts`
- Create: `tests/game-engine.test.ts`

**Interfaces:**
- Produces: `createInitialMatch(players)`, `movePlayer(state, playerId, spaces)`, `resolveTile(state, playerId)`, `advanceTurn(state)`.
- Consumes no network code.

- [ ] **Step 1: Write failing tests for initial state and movement**

```ts
import { describe, expect, it } from 'vitest'
import { createInitialMatch, movePlayer } from '../src/game/engine'

describe('game engine', () => {
  it('starts with round 1 and player at tile 0', () => {
    const state = createInitialMatch([{ id: 'p1', name: 'Raphael' }, { id: 'p2', name: 'Jessica' }])
    expect(state.round).toBe(1)
    expect(state.players.p1.position).toBe(0)
  })

  it('moves around the board safely', () => {
    const state = createInitialMatch([{ id: 'p1', name: 'Raphael' }, { id: 'p2', name: 'Jessica' }])
    const moved = movePlayer(state, 'p1', 6)
    expect(moved.players.p1.position).toBe(6)
  })
})
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test -- --run tests/game-engine.test.ts`

- [ ] **Step 3: Implement launch board and types**

The board must include at least: PARK, PORTA, CORREDOR, DREAM HOUSE, CAPIVARI, BADEN, IGREJA, RODA GIGANTE, SALA plus event/chance/mission tiles.

`GameState` must include `round`, `currentPlayerId`, `turnOrder`, `players`, `territories`, `events`, and `status`.

`GamePlayerState` must include `position`, `couples`, `coins`, `vgv`, `sales`, `score`, `cards`, and `skippedTurns`.

- [ ] **Step 4: Run engine tests**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game tests/game-engine.test.ts
git commit -m "feat: add board and deterministic match engine"
```

---

### Task 3: Add CAPTA SCORE and Room resolution

**Files:**
- Create: `src/game/scoring.ts`
- Modify: `src/game/engine.ts`
- Create: `tests/scoring.test.ts`

**Interfaces:**
- Produces: `calculateCaptaScore(player)` and `resolveRoomVisit(state, playerId, outcomes)`.

- [ ] **Step 1: Write failing scoring tests**

```ts
import { describe, expect, it } from 'vitest'
import { calculateCaptaScore } from '../src/game/scoring'

describe('CAPTA SCORE', () => {
  it('rewards delivered couples, Q, sales, VGV and territories', () => {
    const score = calculateCaptaScore({
      deliveredCouples: 3,
      qualifiedCouples: 2,
      sales: 1,
      vgv: 100000,
      territories: 2,
      missions: 1,
      bonuses: 0,
    })
    expect(score).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run and verify failure**
- [ ] **Step 3: Implement a transparent score formula**

Use constants instead of magic numbers. V1 formula:

```ts
score = deliveredCouples * 100
      + qualifiedCouples * 150
      + sales * 500
      + Math.floor(vgv / 1000)
      + territories * 120
      + missions * 200
      + bonuses
```

- [ ] **Step 4: Implement Room resolution input contract**

```ts
type RoomOutcome = {
  coupleId: string
  qualified: boolean
  converted: boolean
  vgv: number
}
```

Resolution must clear delivered couples from carried state, increment Q/NQ, sales and VGV, then recalculate score.

- [ ] **Step 5: Run tests and commit**

```bash
npm test -- --run tests/scoring.test.ts tests/game-engine.test.ts
git add src/game tests
git commit -m "feat: add room resolution and CAPTA SCORE"
```

---

### Task 4: Add cards, territories and global events

**Files:**
- Create: `src/game/cards.ts`
- Create: `src/game/events.ts`
- Modify: `src/game/engine.ts`
- Create: `tests/cards-events.test.ts`

**Interfaces:**
- Produces: `applyCard(state, actorId, card, targetId?)`, `claimTerritory(state, playerId, tileId)`, `applyGlobalEvent(state, event)`.

- [ ] **Step 1: Write failing tests for five launch cards**

Must cover at minimum: Uber para Sala, Casal Duplo, Cliente VIP, Escudo, Atalho.

- [ ] **Step 2: Write failing tests for territory claim and rent/bonus**
- [ ] **Step 3: Implement card catalog**

Launch catalog should include 10–15 cards, with hostile effects limited and counterable.

- [ ] **Step 4: Implement six global events**

Capivari Lotado, Chuva em Campos, Evento na Cidade, Fiscalização, Alta Temporada, Noite de Vendas.

- [ ] **Step 5: Run tests and commit**

```bash
npm test -- --run tests/cards-events.test.ts
git add src/game tests/cards-events.test.ts
git commit -m "feat: add cards territories and city events"
```

---

### Task 5: Build the game board UI and local playable prototype

**Files:**
- Create: `src/components/GameBoard.tsx`
- Create: `src/components/DiceButton.tsx`
- Create: `src/components/PlayerHud.tsx`
- Create: `src/components/LiveRanking.tsx`
- Create: `src/components/EventBanner.tsx`
- Create: `src/features/match/MatchScreen.tsx`
- Modify: `src/App.tsx`
- Create: `tests/match-screen.test.tsx`

**Interfaces:**
- Consumes the pure engine from Tasks 2–4.
- Produces a fully playable single-browser prototype before networking.

- [ ] **Step 1: Write failing UI tests**

Tests must prove the board renders named locations, dice action changes the active player position, HUD updates couples/VGV/coins, and ranking sorts by CAPTA SCORE.

- [ ] **Step 2: Implement board layout**

Use responsive CSS grid/SVG with visible named districts, player tokens, a highlighted SALA, and strong mobile touch targets.

- [ ] **Step 3: Implement dice interaction**

For this local prototype only, inject a deterministic/random provider through the engine so UI tests can fix the roll result. Production authority moves server-side later.

- [ ] **Step 4: Implement HUD, event banner, cards panel and ranking**
- [ ] **Step 5: Run tests/build and commit**

```bash
npm test -- --run
npm run build
git add src tests
git commit -m "feat: add local playable CAPTA CITY match"
```

---

### Task 6: Create dedicated Supabase backend and secure schema

**Files:**
- Create: `supabase/migrations/0001_capta_city_core.sql`
- Create: `src/lib/supabase.ts`
- Create: `.env.example`

**Interfaces:**
- Produces authenticated persistence for profiles, rooms, players, turns, couples, cards, territories, results, inventory and real-performance rewards.

- [ ] **Step 1: Create schema migration**

Tables: `profiles`, `game_rooms`, `game_players`, `game_turns`, `game_events`, `game_cards`, `player_cards`, `territories`, `game_couples`, `match_results`, `player_inventory`, `real_performance_rewards`, `game_action_audit`.

- [ ] **Step 2: Add foreign keys, checks and indexes**

Room codes unique. `game_players` unique on `(room_id, user_id)`. CAPTA SCORE and VGV non-negative. Host must be a room member.

- [ ] **Step 3: Enable RLS on every exposed table**

Policies must restrict room data to room members, own profile/inventory to the current user, and host-only actions where appropriate.

- [ ] **Step 4: Run Supabase security/performance advisors**

Expected: no missing-RLS warning on exposed CAPTA CITY tables.

- [ ] **Step 5: Commit migration**

```bash
git add supabase src/lib .env.example
git commit -m "feat: add secure CAPTA CITY Supabase schema"
```

---

### Task 7: Implement authoritative game actions

**Files:**
- Create: `supabase/functions/game-action/index.ts`
- Create: `src/features/match/gameApi.ts`
- Create: `tests/game-api.test.ts`

**Interfaces:**
- Client sends `{ roomId, action, payload }`.
- Server validates authenticated user, room membership, active turn and action legality.
- Server returns the resulting authoritative state/event.

- [ ] **Step 1: Write failing client contract tests**
- [ ] **Step 2: Implement `ROLL_DICE`**

Server generates 1–6, moves the active player, resolves tile effects, writes the turn/audit record, and advances state atomically.

- [ ] **Step 3: Implement `PLAY_CARD`, `CLAIM_TERRITORY`, `RESOLVE_ROOM`, `END_TURN`**
- [ ] **Step 4: Reject cheating attempts**

Reject wrong player turn, impossible movement, unowned card, duplicate Room resolution, and non-member room access.

- [ ] **Step 5: Test and commit**

```bash
npm test -- --run tests/game-api.test.ts
git add supabase/functions src/features/match tests/game-api.test.ts
git commit -m "feat: add authoritative multiplayer game actions"
```

---

### Task 8: Add multiplayer rooms, lobby and Realtime

**Files:**
- Create: `src/features/lobby/LobbyScreen.tsx`
- Create: `src/features/lobby/roomApi.ts`
- Create: `src/features/lobby/useRoomRealtime.ts`
- Modify: `src/App.tsx`
- Create: `tests/lobby.test.tsx`

**Interfaces:**
- Produces create/join room by short code, ready state, presence, host start, reconnect.

- [ ] **Step 1: Write failing lobby tests**

Create-room returns code; join-room shows both players; ready state updates; host cannot start below 2 players; refresh rehydrates room state.

- [ ] **Step 2: Implement room creation/join**
- [ ] **Step 3: Implement private Realtime topic `room:<roomId>`**

Broadcast: joined, ready, started, dice, movement, card, couple, territory, Room result, sale/VGV, event, turn, match end.

Presence: connected room members.

- [ ] **Step 4: Reconnect from persisted Postgres state**
- [ ] **Step 5: Test two-browser scenario and commit**

```bash
npm test -- --run tests/lobby.test.tsx
git add src/features/lobby src/App.tsx tests/lobby.test.tsx
git commit -m "feat: add multiplayer lobby and realtime sync"
```

---

### Task 9: Add progression and hybrid real-world reward hooks

**Files:**
- Create: `src/features/progression/progression.ts`
- Create: `src/features/rewards/rewards.ts`
- Create: `tests/progression-rewards.test.ts`

**Interfaces:**
- Produces level/XP/coins, cosmetics inventory, reward-claim audit records.

- [ ] **Step 1: Write failing progression tests**
- [ ] **Step 2: Implement match reward calculation**
- [ ] **Step 3: Implement real-performance reward rules**

Initial rules from spec: real couple -> coins/XP; 3 real couples/day -> reward box; real sale -> cosmetic/rare card unlock; weekly target -> title/badge/skin.

- [ ] **Step 4: Enforce fairness constraint**

No real-world reward may directly add match CAPTA SCORE or VGV.

- [ ] **Step 5: Run tests and commit**

```bash
npm test -- --run tests/progression-rewards.test.ts
git add src/features tests/progression-rewards.test.ts
git commit -m "feat: add progression and hybrid rewards"
```

---

### Task 10: PWA, polish, podium and deployment verification

**Files:**
- Create: `public/manifest.webmanifest`
- Modify: `vite.config.ts`
- Create: `src/features/match/PodiumScreen.tsx`
- Modify: `src/styles.css`
- Modify: `README.md`

**Interfaces:**
- Produces installable mobile PWA and deployment-ready production build.

- [ ] **Step 1: Add manifest and installability metadata**
- [ ] **Step 2: Add synchronized end-of-match podium**

Rank by CAPTA SCORE, then sales, then VGV as deterministic tie-breakers.

- [ ] **Step 3: Add game feedback polish**

Dice movement, VIP, territory, card attack, Room resolution and sale must have readable visual feedback. Respect reduced-motion preferences.

- [ ] **Step 4: Run full verification**

```bash
npm test -- --run
npm run build
```

Then verify manually with two devices/browsers:

1. Create room.
2. Join second player.
3. Ready both.
4. Start.
5. Roll/advance turns.
6. Collect couples.
7. Reach SALA and resolve Q/NQ/sale/VGV.
8. Claim territory.
9. Use cards.
10. Refresh one client and recover state.
11. Complete 12-round match.
12. Confirm synchronized podium.

- [ ] **Step 5: Deploy to Vercel and verify production URL**
- [ ] **Step 6: Commit**

```bash
git add public src vite.config.ts README.md
git commit -m "feat: finish CAPTA CITY v1 PWA"
```

---

## Self-Review

- Spec coverage: all V1 requirements are mapped to Tasks 1–10.
- Explicitly postponed features remain out of scope.
- Security is covered through dedicated Supabase schema, RLS and server-authoritative actions.
- Multiplayer recovery uses persistent Postgres state rather than ephemeral events alone.
- The pure game engine is separated from networking/UI so rules remain testable.
- Real-world results only unlock progression/rewards and do not directly determine match victory.
- The first independently visible milestone is Task 1; the first actually playable milestone is Task 5; multiplayer is completed in Tasks 6–8.
