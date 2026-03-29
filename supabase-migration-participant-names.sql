    alter table public.tournaments add column if not exists participant_names jsonb default '[]'::jsonb;
