# Tic-Tac-Toe Realtime (React + Supabase)

Modern, mobile-first Tic-Tac-Toe web app built with Vite, React, Tailwind CSS, and Supabase Realtime. Create a lobby, share the invite link (WhatsApp ready), and play with optimistic UI, automatic score keeping, and conflict handling.

## Stack

- React 19 + TypeScript + Vite 7
- Tailwind CSS 3 + Headless UI + clsx
- Supabase Realtime + Postgres for persistent state
- Vitest + Testing Library for unit tests
- ESLint + Prettier for linting and formatting

## Quick Start

```bash
npm install
npm run dev        # start dev server (http://localhost:5173)
npm run lint       # lint all .ts/.tsx files
npm run test       # vitest (happy-dom)
npm run build      # type-check + production build
npm run preview    # serve the dist bundle
```

## Environment Variables

Copy `env.example` → `.env` and provide your Supabase project details:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Both variables are required at build and runtime. If they are missing, the app logs a warning and realtime updates are skipped.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/migrations/0001_create_games.sql` in the SQL editor (or CLI). It creates `games` and `invites`, triggers, demo policies, and adds the table to `supabase_realtime`.
3. In the dashboard, enable Realtime for the `games` table (INSERT/UPDATE/DELETE).
4. (Optional) Replace demo RLS policies with stricter ones once Auth is enabled.

## Database Schema Highlights

- `games` contains the authoritative board (`text[9]`), scores, active turn, and optimistic concurrency column `version` (incremented client-side, guarded server-side with `eq('version', current)`).
- `invites` holds optional share codes keyed to a game id.
- Trigger `handle_updated_at` keeps `updated_at` in UTC on every modification.

## Security & RLS

- **Demo policy** (`public_write_games_demo`) leaves reads/writes open—acceptable for local testing only.
- Harden for production:
  - Enable Supabase Auth.
  - Add auth-bound columns (`player_x_uid`, `player_o_uid`) or a join table.
  - Example policy once the auth columns exist:
    ```sql
    create policy "allow players to move" on public.games
      for update
      using (
        auth.role() = 'authenticated'
        and auth.uid() = any(array[player_x_uid, player_o_uid])
      )
      with check (
        auth.uid() = any(array[player_x_uid, player_o_uid])
      );
    ```
  - Remove the demo allow-all policy afterwards.

## App Architecture

- `App.tsx` wires the router (`/`, `/game/:id`, `/profile`) inside `SupabaseProvider`.
- `hooks/useGameSubscription.ts`:
  - Fetches the current game.
  - Subscribes to `postgres_changes` with row-level filter (`id=eq.${gameId}`) for low payload volume.
  - Exposes `createGame`, `joinGame`, `makeMove`, `resetBoard`, `resetScores`.
  - Implements optimistic UI with rollback on failures and surfaces `conflict: true` when a stale `version` update is rejected.
- `lib/gameService.ts` handles Supabase mutations, scoreboard increments, draw detection, turn swaps, and concurrency guard.
- UI components:
  - `Board` (keyboard-accessible, animated winning lines).
  - `GameSidebar` (scores, reset actions, share CTA).
  - `NamePrompt` (Headless UI dialog for display names).
  - `ShareButtons` (native share fallback + copy + WhatsApp).
- Styling: Tailwind utilities with custom layers for glass panels, gradients, and animations (`pop`, `pulseHighlight`, `shimmer`).

## Edge Cases & Realtime Behaviour

- **Simultaneous joins**: `joinGame` updates `player_o` only when `player_o IS NULL`, guaranteeing atomic assignment.
- **Turn enforcement**: `updateGameMove` checks the latest `turn` and board cell before applying a move.
- **Conflict resolution**: every update filters on `version`; conflicts trigger a refetch to sync the UI (last-write-wins).
- **Offline / reconnect**: channel status toggles `isReconnecting`, and the UI displays a reconnect badge.
- **WhatsApp share**: `https://wa.me/?text=${encodeURIComponent("Play Tic-Tac-Toe: " + url)}`.

## Testing

- `src/lib/__tests__/gameLogic.test.ts`: verifies all winning lines, draw detection, and ongoing states.
- `src/lib/__tests__/gameService.test.ts`: mocks the Supabase client to assert move handling, score increments, and version conflicts.
- Run `npm run test` (happy-dom environment).

## REST Debug Payloads (Supabase)

- **Create game** (`POST /rest/v1/games`):
  ```json
  {
    "player_x": "Ada",
    "board": ["", "", "", "", "", "", "", "", ""],
    "status": "waiting",
    "turn": "X"
  }
  ```
- **Play move** (`PATCH /rest/v1/games?id=eq.{id}`):
  ```json
  {
    "board": ["X", "", "", "", "", "", "", "", ""],
    "turn": "O",
    "last_move_by": "X",
    "last_move_at": "2025-01-01T12:00:00Z",
    "version": 1
  }
  ```
- **Join game** (`PATCH /rest/v1/games?id=eq.{id}`):
  ```json
  {
    "player_o": "Grace",
    "status": "in_progress"
  }
  ```

## Deployment (Vercel)

1. Set project env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in Vercel.
2. Build command: `npm run build`, Output dir: `dist`.
3. Optional: run `npm run test` in CI before deploying.
4. In Supabase, add your deployed domain under allowed origins (Auth → URL Configuration & Realtime settings).

## Developer Notes

- Board cells are `<button>` elements with arrow-key navigation and focus outlines.
- Display names persist in `localStorage`; the Profile page surfaces the cached value.
- `updateGameMove` is the single mutation entrypoint for moves, and the hook wraps it with optimistic UI + rollback.
- Tailwind config exposes design tokens (background/surface colors, glow shadows) and animations.

## Troubleshooting

- Missing env vars → realtime disabled with console warning.
- No realtime updates → ensure `games` table is part of `supabase_realtime` publication and the dashboard toggle is on.
- Frequent conflicts → verify the client passes the latest `version`; stale clients should refresh before moving again.

