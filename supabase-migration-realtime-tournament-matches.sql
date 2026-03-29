-- Live-Sync der Spielergebnisse (z. B. Handy ↔ Desktop): einmal im SQL-Editor ausführen.
-- Wenn die Meldung kommt, die Tabelle sei schon in der Publication: Nicht schlimm.

alter publication supabase_realtime add table public.tournament_matches;
