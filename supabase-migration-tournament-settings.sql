-- Einmal im SQL Editor ausführen (Turnier-Einstellungen Wizard / Detail)

alter table public.tournaments add column if not exists court_count integer default 1;
alter table public.tournaments add column if not exists group_ranking_rule text default 'gr_1';
alter table public.tournaments add column if not exists h2h_includes_gd_gf boolean default false;
alter table public.tournaments add column if not exists group_points_preset text default 'pts_3_1_0';
