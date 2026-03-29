-- Nach Schema-Änderung einmal im SQL Editor ausführen

alter table public.tournaments add column if not exists modus_key text;
alter table public.tournaments add column if not exists best_placement integer default 1;
alter table public.tournaments add column if not exists first_match_number integer default 1;
alter table public.tournaments add column if not exists counting_mode text default 'goals';
