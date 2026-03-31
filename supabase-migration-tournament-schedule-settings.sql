-- Zeitplan-Einstellungen (Start, Spieldauer Vorrunde / Finale). Einmal im SQL-Editor ausführen.

alter table public.tournaments
  add column if not exists tournament_start_at timestamptz null;

alter table public.tournaments
  add column if not exists group_match_duration_minutes integer null;

alter table public.tournaments
  add column if not exists ko_match_duration_minutes integer null;
