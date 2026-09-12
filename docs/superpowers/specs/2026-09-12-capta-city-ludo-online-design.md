# CAPTA CITY — Ludo Online Design

Date: 2026-09-12
Status: Approved in chat

## Product direction

CAPTA CITY becomes a four-player online Ludo-style game. The board and movement follow familiar Ludo rules, while the theme and competitive layer stay connected to captação: each piece is a casal, the final destination is the SALA, and players collect Q/NQ, vendas, VGV, bonuses and events while racing.

## Match format

- Exactly 4 players per online match.
- Four colors/seats: red, blue, green and yellow.
- Four casal pieces per player.
- Turn-based dice from 1 to 6.
- A six is required to launch a casal from base.
- Rolling a six grants another roll.
- A piece travels around the shared track, enters its own home lane and must reach the SALA with an exact roll.
- Landing on an opponent on a non-safe shared cell captures that piece and returns it to base.
- Safe cells include all four start cells and the traditional safe checkpoints.
- First player to deliver all four casal pieces to the SALA wins.

## CAPTA competitive layer

The Ludo race remains the primary victory condition. Selected track cells trigger CAPTA effects without changing the core movement rules:

- Q: adds qualification points.
- NQ: records NQ and can remove a small score bonus.
- VENDA: adds one virtual sale and virtual VGV.
- BÔNUS: coins/score or an extra tactical benefit.
- EVENTO: announces a shared match event.

CAPTA SCORE, sales and VGV are secondary match statistics/ranking signals, not a replacement for the Ludo win condition.

## Authentication

- Supabase Auth with Google OAuth.
- The player profile uses the Google name, email and avatar when available.
- Session persists across reloads.
- Logout is available from the lobby.
- Production redirect: `https://aureon-tech.github.io/CAPTA-CITY/`.
- Supabase OAuth callback: `https://xiejbwdvyjnfhlcnxhen.supabase.co/auth/v1/callback`.

Google provider credentials must be configured in Supabase/Google Cloud before end-to-end sign-in can succeed.

## Lobby

After login the player sees:

1. Criar sala — creates a private match and a short invite code.
2. Entrar por código — joins an existing waiting room.
3. Jogar agora — joins an available matchmaking room or creates one.

A room has four fixed seats/colors. The host can start only when four players are present. The lobby shows avatar, player name, seat color and readiness.

## Realtime and persistence

Dedicated Supabase project: `Gamificacao300` (`xiejbwdvyjnfhlcnxhen`).

Core tables:

- `profiles`: persistent public player profile.
- `game_rooms`: room code, host, status, matchmaking flag, serialized game state, version.
- `game_players`: room membership, fixed seat/color, profile snapshot, ready state.
- `game_turns`: append-only turn/action history for audit and reconnect diagnostics.

The current match state is persisted in `game_rooms.game_state` so refresh/reconnect can restore the match. Realtime Postgres Changes synchronize room/player/state updates between the four devices.

## Security

- RLS enabled on every exposed CAPTA CITY table.
- Only authenticated users can create rooms or memberships.
- Players can read rooms only when they are members or the room is a waiting matchmaking room needed for join discovery.
- Players can modify only their own membership readiness/profile.
- Room state updates require membership and are versioned.
- No `service_role` key is exposed in the browser.
- Google `user_metadata` is used only for display profile data, never authorization.

## Frontend architecture

Keep the existing React + Vite + TypeScript PWA and add focused modules:

- `src/lib/supabase.ts` — browser Supabase client.
- `src/game/ludo.ts` — pure, deterministic Ludo rules.
- `src/features/auth/` — Google sign-in/session UI.
- `src/features/lobby/` — room creation/join/matchmaking/realtime.
- `src/features/match/LudoMatchScreen.tsx` — online turn UI.
- `src/components/LudoBoard.tsx` — four-color visual board.

The existing city-game engine remains in the repository for compatibility while the new app flow uses the Ludo engine.

## Acceptance criteria

The first release is ready when:

1. The app presents Google sign-in and restores a valid session.
2. A signed-in player can create a room and receive a short code.
3. Three other signed-in players can join and receive unique colors.
4. All four clients see room membership changes without manual refresh.
5. The host can start only with four players.
6. Each player has four casal pieces.
7. A six launches a piece; legal pieces can be selected after a roll.
8. Capture returns an opponent piece to base except on safe cells.
9. Pieces enter the correct home lane and require an exact roll to reach SALA.
10. Four delivered pieces end the game with a winner.
11. Q/NQ/Venda/VGV events update match stats and are synchronized.
12. Refresh/reconnect restores the latest room/game state.
13. Existing PWA security rules continue to avoid caching auth/session responses.
14. CI tests and production build pass before merge to `main`.