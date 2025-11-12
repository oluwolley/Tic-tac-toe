-- Enable required extensions
create extension if not exists "pgcrypto";

-- Core games table
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  status text not null default 'waiting' check (status in ('waiting', 'in_progress', 'finished')),
  board text[] not null default array['','','','','','','','','']::text[] check (array_length(board, 1) = 9),
  turn text not null default 'X' check (turn in ('X', 'O')),
  player_x text,
  player_o text,
  score_x integer not null default 0,
  score_o integer not null default 0,
  last_move_by text check (last_move_by in ('X', 'O')),
  last_move_at timestamptz,
  version integer not null default 0
);

-- Invites table for optional short codes
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz
);

-- Maintain updated_at automatically
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_on_games on public.games;
create trigger set_updated_at_on_games
before update on public.games
for each row
execute procedure public.handle_updated_at();

-- Helpful indexes
create index if not exists games_status_idx on public.games (status);
create index if not exists games_updated_at_idx on public.games (updated_at desc);
create index if not exists invites_code_idx on public.invites (code);

-- Enable Row Level Security
alter table public.games enable row level security;
alter table public.invites enable row level security;

-- Development policy (replace for production)
create policy "public_read_games" on public.games
  for select using (true);

create policy "public_write_games_demo" on public.games
  for all
  using (true)
  with check (true);

-- Example hardened policy (commented, adapt when Supabase Auth is enabled):
-- create policy "players_can_play" on public.games
--   for update
--   using (
--     auth.role() = 'authenticated'
--     and auth.uid() is not null
--     and auth.uid()::text = coalesce(player_x, '') -- replace with player_x_uid column for production
--   );

-- Enable realtime replication for the games table
alter publication supabase_realtime add table public.games;

