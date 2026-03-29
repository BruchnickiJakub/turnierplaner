-- Einmal ausführen, falls die Tabelle noch alte Spalten hat (Veranstalter, Zeiten, Ort …)

alter table public.tournaments drop column if exists organizer;
alter table public.tournaments drop column if exists starts_at;
alter table public.tournaments drop column if exists ends_at;
alter table public.tournaments drop column if exists venue_name;
alter table public.tournaments drop column if exists venue_address;
