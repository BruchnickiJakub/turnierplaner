-- Neues Projekt: SQL Editor → Run
-- Bestehende Installation mit alter Tabelle: zusätzlich
-- supabase-migration-drop-tournament-columns.sql ausführen

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  sport text,
  description text,
  format text,
  team_count integer,
  modus_key text,
  best_placement integer default 1,
  first_match_number integer default 1,
  counting_mode text default 'goals',
  court_count integer default 1,
  group_ranking_rule text default 'gr_1',
  h2h_includes_gd_gf boolean default false,
  group_points_preset text default 'pts_3_1_0',
  participant_names jsonb default '[]'::jsonb,
  tournament_start_at timestamptz null,
  group_match_duration_minutes integer null,
  ko_match_duration_minutes integer null,
  spectator_token uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tournaments_user_id_idx on public.tournaments (user_id);

create unique index if not exists tournaments_spectator_token_uidx
  on public.tournaments (spectator_token)
  where spectator_token is not null;

alter table public.tournaments enable row level security;

create policy "tournaments_select_own"
  on public.tournaments for select
  using (auth.uid() = user_id);

create policy "tournaments_insert_own"
  on public.tournaments for insert
  with check (auth.uid() = user_id);

create policy "tournaments_update_own"
  on public.tournaments for update
  using (auth.uid() = user_id);

create policy "tournaments_delete_own"
  on public.tournaments for delete
  using (auth.uid() = user_id);

-- Vorrunde-Spiele (siehe supabase-migration-tournament-matches.sql für bestehende Projekte)

create table if not exists public.tournament_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  sort_index integer not null,
  match_phase text not null default 'group',
  group_code text not null default '',
  pitch integer not null default 1,
  start_time text,
  slot_home integer,
  slot_away integer,
  label_home text,
  label_away text,
  goals_home integer,
  goals_away integer,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, sort_index)
);

create index if not exists tournament_matches_tournament_id_idx
  on public.tournament_matches (tournament_id);

alter table public.tournament_matches enable row level security;

drop policy if exists "tournament_matches_select" on public.tournament_matches;
drop policy if exists "tournament_matches_insert" on public.tournament_matches;
drop policy if exists "tournament_matches_update" on public.tournament_matches;
drop policy if exists "tournament_matches_delete" on public.tournament_matches;

create policy "tournament_matches_select"
  on public.tournament_matches for select
  using (
    exists (
      select 1 from public.tournaments t
      where t.id = tournament_matches.tournament_id
        and t.user_id = auth.uid()
    )
  );

create policy "tournament_matches_insert"
  on public.tournament_matches for insert
  with check (
    exists (
      select 1 from public.tournaments t
      where t.id = tournament_matches.tournament_id
        and t.user_id = auth.uid()
    )
  );

create policy "tournament_matches_update"
  on public.tournament_matches for update
  using (
    exists (
      select 1 from public.tournaments t
      where t.id = tournament_matches.tournament_id
        and t.user_id = auth.uid()
    )
  );

create policy "tournament_matches_delete"
  on public.tournament_matches for delete
  using (
    exists (
      select 1 from public.tournaments t
      where t.id = tournament_matches.tournament_id
        and t.user_id = auth.uid()
    )
  );

-- Zuschauer (öffentlicher Lesezugriff per Token); siehe supabase-migration-spectator.sql für bestehende DBs.

create or replace function public.spectator_get_data(p_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  tid uuid;
  t_json jsonb;
  m_json jsonb;
begin
  if p_token is null then
    return null;
  end if;

  select t.id into tid
  from public.tournaments t
  where t.spectator_token = p_token
  limit 1;

  if tid is null then
    return null;
  end if;

  select jsonb_build_object(
    'id', t.id,
    'title', t.title,
    'team_count', t.team_count,
    'modus_key', t.modus_key,
    'first_match_number', t.first_match_number,
    'counting_mode', t.counting_mode,
    'court_count', t.court_count,
    'group_ranking_rule', t.group_ranking_rule,
    'h2h_includes_gd_gf', t.h2h_includes_gd_gf,
    'group_points_preset', t.group_points_preset,
    'participant_names', t.participant_names,
    'tournament_start_at', t.tournament_start_at,
    'group_match_duration_minutes', t.group_match_duration_minutes,
    'ko_match_duration_minutes', t.ko_match_duration_minutes
  )
  into t_json
  from public.tournaments t
  where t.id = tid;

  select coalesce(
    jsonb_agg(to_jsonb(m) order by m.sort_index),
    '[]'::jsonb
  )
  into m_json
  from public.tournament_matches m
  where m.tournament_id = tid;

  return jsonb_build_object(
    'tournament', t_json,
    'matches', coalesce(m_json, '[]'::jsonb)
  );
end;
$$;

revoke all on function public.spectator_get_data(uuid) from public;
grant execute on function public.spectator_get_data(uuid) to anon;
grant execute on function public.spectator_get_data(uuid) to authenticated;
grant execute on function public.spectator_get_data(uuid) to service_role;
