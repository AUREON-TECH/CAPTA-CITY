-- CAPTA CITY Ludo Online — Supabase schema
-- Applied to project xiejbwdvyjnfhlcnxhen (Gamificacao300) on 2026-09-12.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Jogador',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'waiting' check (status in ('waiting','playing','finished')),
  is_matchmaking boolean not null default false,
  game_state jsonb not null default '{}'::jsonb,
  version bigint not null default 0 check (version >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_players (
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  seat smallint not null check (seat between 0 and 3),
  color text not null check (color in ('red','blue','green','yellow')),
  display_name text not null default 'Jogador',
  avatar_url text,
  is_ready boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id),
  unique (room_id, seat),
  unique (room_id, color)
);

create table if not exists public.game_turns (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists game_rooms_status_matchmaking_idx on public.game_rooms(status, is_matchmaking, created_at);
create index if not exists game_rooms_host_user_idx on public.game_rooms(host_user_id);
create index if not exists game_players_user_idx on public.game_players(user_id, room_id);
create index if not exists game_turns_room_created_idx on public.game_turns(room_id, created_at desc);
create index if not exists game_turns_user_idx on public.game_turns(user_id);

alter table public.profiles enable row level security;
alter table public.game_rooms enable row level security;
alter table public.game_players enable row level security;
alter table public.game_turns enable row level security;

revoke all on public.profiles from anon;
revoke all on public.game_rooms from anon;
revoke all on public.game_players from anon;
revoke all on public.game_turns from anon;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.game_rooms to authenticated;
grant select, insert, update, delete on public.game_players to authenticated;
grant select, insert on public.game_turns to authenticated;
grant usage, select on sequence public.game_turns_id_seq to authenticated;

drop policy if exists "profiles_read_authenticated" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "rooms_read_waiting_or_member" on public.game_rooms;
drop policy if exists "rooms_insert_host" on public.game_rooms;
drop policy if exists "rooms_update_member" on public.game_rooms;
drop policy if exists "players_read_authenticated" on public.game_players;
drop policy if exists "players_read_waiting_or_member" on public.game_players;
drop policy if exists "players_insert_self_waiting" on public.game_players;
drop policy if exists "players_update_self" on public.game_players;
drop policy if exists "players_delete_self_or_host" on public.game_players;
drop policy if exists "turns_read_member" on public.game_turns;
drop policy if exists "turns_insert_self_member" on public.game_turns;

create policy "profiles_read_authenticated" on public.profiles for select to authenticated using (true);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "rooms_read_waiting_or_member" on public.game_rooms for select to authenticated using (
  status = 'waiting' or host_user_id = (select auth.uid()) or exists (
    select 1 from public.game_players gp where gp.room_id = game_rooms.id and gp.user_id = (select auth.uid())
  )
);
create policy "rooms_insert_host" on public.game_rooms for insert to authenticated with check (host_user_id = (select auth.uid()));
create policy "rooms_update_member" on public.game_rooms for update to authenticated using (
  host_user_id = (select auth.uid()) or exists (
    select 1 from public.game_players gp where gp.room_id = game_rooms.id and gp.user_id = (select auth.uid())
  )
) with check (
  host_user_id = (select auth.uid()) or exists (
    select 1 from public.game_players gp where gp.room_id = game_rooms.id and gp.user_id = (select auth.uid())
  )
);

-- Room player rows contain only match display data, so authenticated users may read them.
-- This avoids recursive RLS policies while write policies remain identity-scoped.
create policy "players_read_authenticated" on public.game_players for select to authenticated using (true);
create policy "players_insert_self_waiting" on public.game_players for insert to authenticated with check (
  user_id = (select auth.uid()) and exists (
    select 1 from public.game_rooms gr where gr.id = game_players.room_id and gr.status = 'waiting'
  )
);
create policy "players_update_self" on public.game_players for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "players_delete_self_or_host" on public.game_players for delete to authenticated using (
  user_id = (select auth.uid()) or exists (
    select 1 from public.game_rooms gr where gr.id = game_players.room_id and gr.host_user_id = (select auth.uid()) and gr.status = 'waiting'
  )
);

create policy "turns_read_member" on public.game_turns for select to authenticated using (
  exists (select 1 from public.game_players gp where gp.room_id = game_turns.room_id and gp.user_id = (select auth.uid()))
);
create policy "turns_insert_self_member" on public.game_turns for insert to authenticated with check (
  user_id = (select auth.uid()) and exists (
    select 1 from public.game_players gp where gp.room_id = game_turns.room_id and gp.user_id = (select auth.uid())
  )
);

create or replace function public.roll_ludo_dice(p_room_id uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_room public.game_rooms%rowtype;
  v_roll integer;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  select * into v_room from public.game_rooms where id = p_room_id;
  if not found or v_room.status <> 'playing' then raise exception 'match is not active'; end if;
  if not exists (select 1 from public.game_players gp where gp.room_id = p_room_id and gp.user_id = v_user) then
    raise exception 'not a room member';
  end if;
  if coalesce(v_room.game_state->>'currentPlayerId', '') <> v_user::text then raise exception 'not your turn'; end if;
  v_roll := floor(random() * 6 + 1)::integer;
  return v_roll;
end;
$$;

revoke all on function public.roll_ludo_dice(uuid) from public;
revoke all on function public.roll_ludo_dice(uuid) from anon;
grant execute on function public.roll_ludo_dice(uuid) to authenticated;

-- Realtime publication (run only when each table is not already published):
-- alter publication supabase_realtime add table public.game_rooms;
-- alter publication supabase_realtime add table public.game_players;
