-- Finalrunde: Phase & Platzhalter-Labels (SQL Editor → einmal ausführen)

alter table public.tournament_matches add column if not exists match_phase text not null default 'group';
alter table public.tournament_matches add column if not exists label_home text;
alter table public.tournament_matches add column if not exists label_away text;

alter table public.tournament_matches alter column slot_home drop not null;
alter table public.tournament_matches alter column slot_away drop not null;
