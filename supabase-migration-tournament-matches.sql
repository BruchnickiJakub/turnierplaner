-- Vorrunde: Spielpaarungen & Ergebnisse (SQL Editor → Run)

create table if not exists public.tournament_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  sort_index integer not null,
  group_code text not null default '',
  pitch integer not null default 1,
  start_time text,
  slot_home integer not null,
  slot_away integer not null,
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
