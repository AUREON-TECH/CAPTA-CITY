# CAPTA CITY Ludo Online — Implementation Plan

**Goal:** Ship the existing CAPTA CITY PWA as a four-player Ludo-style online game with Google sign-in, room codes, matchmaking, Supabase persistence/realtime and CAPTA-themed match events.

**Architecture:** Preserve the current React/Vite/PWA foundation. Add a pure Ludo domain engine, a Supabase browser client, authenticated lobby APIs, a realtime room hook and a new Ludo match UI. Persist room membership and serialized authoritative-enough match state in the dedicated `Gamificacao300` Supabase project with RLS. Keep the existing city-game engine/tests intact to avoid regressions.

## Task 1 — Lock down the new rules with tests

- Add `tests/ludo-engine.test.ts` first.
- Prove exactly four players, four pieces each, six-to-launch, safe-cell capture rules, exact finish and winner detection.
- Run on CI and confirm tests fail before production implementation.

## Task 2 — Implement the pure Ludo engine

- Add `src/game/ludo.ts` and Ludo types.
- Implement global track positions with color-specific start offsets.
- Implement legal move discovery, piece movement, capture, safe cells, home lane, extra turn on six, CAPTA event resolution and winner state.
- Make state JSON-safe for Supabase persistence.

## Task 3 — Add dedicated Supabase schema and security

- Create `profiles`, `game_rooms`, `game_players`, `game_turns`.
- Add indexes/check constraints and four-seat uniqueness.
- Enable RLS on all exposed tables.
- Add room/member/profile policies.
- Add tables to `supabase_realtime` publication.
- Run Supabase security/performance advisors.
- Store the reproducible SQL in the repository.

## Task 4 — Add Google Auth client

- Pin `@supabase/supabase-js`.
- Add `src/lib/supabase.ts` with project URL and publishable key only.
- Add login/logout/session flow and Google OAuth redirect back to GitHub Pages.
- Never expose service-role credentials.

## Task 5 — Build lobby and matchmaking

- Add create room, join by code and “Jogar agora”.
- Allocate one of four seats/colors transactionally enough for V1.
- Show four player slots and ready state.
- Host start requires exactly four players.
- Subscribe to `game_rooms` and `game_players` changes so all clients update.

## Task 6 — Build the Ludo match UI

- Add a four-color `LudoBoard` with four bases, shared path, home lanes and central SALA.
- Show four casal pieces per player.
- Roll dice, highlight legal pieces and require the player to choose which casal moves.
- Render CAPTA Q/NQ/Venda/VGV feedback and player stats.
- Persist each accepted state transition to the room and append a turn record.

## Task 7 — Integrate app shell and PWA

- Update `App.tsx` to route session → login → lobby → waiting room → match.
- Update styles for mobile-first game presentation.
- Preserve existing safe service-worker behavior for auth/API traffic.
- Update app tests for the Google/lobby flow.

## Task 8 — Verify and deploy

- Run all Vitest tests and Vite production build in GitHub Actions.
- Review Supabase advisors and table/RLS state.
- Merge only after CI is green.
- GitHub Pages deploys automatically from `main`.
- End-to-end Google sign-in requires the Google OAuth client ID/secret to be enabled in Supabase; if those credentials are not configured, code/deployment can be complete but Google sign-in remains externally blocked.