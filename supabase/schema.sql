create extension if not exists "pgcrypto";

create table if not exists public.ipl_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  short_code text not null unique,
  primary_color text not null,
  secondary_color text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.auction_teams (
  id uuid primary key default gen_random_uuid(),
  team_name text not null unique,
  owner_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  player_role text not null,
  auction_team_id uuid not null references public.auction_teams(id) on delete cascade,
  ipl_team_id uuid not null references public.ipl_teams(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_players_auction_team_id on public.players(auction_team_id);
create index if not exists idx_players_ipl_team_id on public.players(ipl_team_id);
create index if not exists idx_players_player_name on public.players(player_name);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  ipl_team_1_id uuid not null references public.ipl_teams(id),
  ipl_team_2_id uuid not null references public.ipl_teams(id),
  match_label text,
  venue text,
  match_date date not null,
  status text not null default 'draft' check (status in ('draft', 'finalized')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ipl_team_1_id <> ipl_team_2_id)
);

create table if not exists public.match_auction_team_totals (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  auction_team_id uuid not null references public.auction_teams(id) on delete cascade,
  total_points numeric(10, 2) not null default 0,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, auction_team_id)
);

create table if not exists public.match_player_stats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,

  -- batting
  runs integer not null default 0,
  balls integer not null default 0,
  fours integer not null default 0,
  sixes integer not null default 0,
  dismissed_for_duck boolean not null default false,

  -- bowling
  overs numeric(4, 1) not null default 0,
  maidens integer not null default 0,
  runs_conceded integer not null default 0,
  wickets integer not null default 0,
  wides integer not null default 0,
  no_balls integer not null default 0,

  -- fielding
  catches integer not null default 0,
  stumpings integer not null default 0,
  runout_direct integer not null default 0,
  runout_assist integer not null default 0,

  -- lineup and multipliers
  is_playing_xi boolean not null default false,
  is_impact_player boolean not null default false,
  is_captain boolean not null default false,
  is_vice_captain boolean not null default false,

  -- computed
  base_points numeric(10, 2) not null default 0,
  multiplier numeric(4, 2) not null default 1,
  total_points numeric(10, 2) not null default 0,
  points_breakdown_json jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, player_id),
  check (not (is_captain and is_vice_captain))
);

create index if not exists idx_matches_match_date on public.matches(match_date desc);
create index if not exists idx_match_totals_match_id on public.match_auction_team_totals(match_id);
create index if not exists idx_match_totals_auction_team_id on public.match_auction_team_totals(auction_team_id);
create index if not exists idx_match_player_stats_match_id on public.match_player_stats(match_id);
create index if not exists idx_match_player_stats_player_id on public.match_player_stats(player_id);

alter table public.ipl_teams enable row level security;
alter table public.auction_teams enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.match_auction_team_totals enable row level security;
alter table public.match_player_stats enable row level security;

drop policy if exists "public read ipl_teams" on public.ipl_teams;
create policy "public read ipl_teams"
on public.ipl_teams
for select
to anon, authenticated
using (true);

drop policy if exists "public read auction_teams" on public.auction_teams;
create policy "public read auction_teams"
on public.auction_teams
for select
to anon, authenticated
using (true);

drop policy if exists "public read players" on public.players;
create policy "public read players"
on public.players
for select
to anon, authenticated
using (true);

drop policy if exists "public all matches" on public.matches;
create policy "public all matches"
on public.matches
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "public all match_auction_team_totals" on public.match_auction_team_totals;
create policy "public all match_auction_team_totals"
on public.match_auction_team_totals
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "public all match_player_stats" on public.match_player_stats;
create policy "public all match_player_stats"
on public.match_player_stats
for all
to anon, authenticated
using (true)
with check (true);
