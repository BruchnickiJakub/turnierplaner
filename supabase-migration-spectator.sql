-- Zuschauer-Link: öffentlicher Lesezugriff per geheimhaltungswürdigem Token (UUID).
-- Nach dem Ausführen: In Supabase Dashboard unter Database → Functions prüfen,
-- dass die Funktion existiert; „Grant execute to anon“ ist unten enthalten.

alter table public.tournaments
  add column if not exists spectator_token uuid null;

create unique index if not exists tournaments_spectator_token_uidx
  on public.tournaments (spectator_token)
  where spectator_token is not null;

-- Nur Turnier-Stammdaten + Spiele; kein user_id, kein spectator_token in der Antwort.
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
