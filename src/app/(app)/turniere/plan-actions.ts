"use server";

import { buildFullMatchPlan } from "@/lib/build-full-match-plan";
import { createClient } from "@/lib/supabase/server";
import type { TournamentRow } from "@/types/tournament";
import { revalidatePath } from "next/cache";

export type PlanActionResult =
  | { ok: true }
  | { ok: false; error: string };

function buildMatchInsertRows(
  tournamentId: string,
  modusKey: string,
  teamCount: number,
  courtCount: number,
) {
  const courts = Math.min(99, Math.max(1, Math.floor(courtCount)));
  return buildFullMatchPlan(modusKey || "rr_1", teamCount, courts).map(
    (r) => ({
      tournament_id: tournamentId,
      sort_index: r.sort_index,
      match_phase: r.match_phase,
      group_code: r.group_code,
      pitch: r.pitch,
      start_time: r.start_time,
      slot_home: r.slot_home,
      slot_away: r.slot_away,
      label_home: r.label_home,
      label_away: r.label_away,
    }),
  );
}

/** Löscht alle Spiele und legt den Plan neu an (z. B. nach geänderten Turnier-Einstellungen). */
export async function replaceTournamentMatchPlan(
  tournamentId: string,
  modusKey: string,
  teamCount: number,
  courtCount: number,
): Promise<PlanActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  const { data: t, error: te } = await supabase
    .from("tournaments")
    .select("user_id")
    .eq("id", tournamentId)
    .maybeSingle();

  if (te || !t) return { ok: false, error: "Turnier nicht gefunden." };
  if (t.user_id !== user.id) return { ok: false, error: "Kein Zugriff." };

  const { error: de } = await supabase
    .from("tournament_matches")
    .delete()
    .eq("tournament_id", tournamentId);

  if (de) return { ok: false, error: de.message };

  const n = teamCount;
  if (n < 2) return { ok: true };

  const rows = buildMatchInsertRows(
    tournamentId,
    modusKey,
    n,
    courtCount,
  );
  if (rows.length === 0) return { ok: true };

  const { error: ie } = await supabase.from("tournament_matches").insert(rows);
  if (ie) return { ok: false, error: ie.message };

  return { ok: true };
}

export async function ensureVorrundeSchedule(
  tournamentId: string,
): Promise<PlanActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  const { data: tRaw, error: le } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .maybeSingle();

  if (le || !tRaw) return { ok: false, error: "Turnier nicht gefunden." };
  const t = tRaw as TournamentRow;
  if (t.user_id !== user.id) return { ok: false, error: "Kein Zugriff." };

  const n = t.team_count ?? 0;
  if (n < 2) return { ok: true };

  const { count, error: ce } = await supabase
    .from("tournament_matches")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", tournamentId);

  if (ce) return { ok: false, error: ce.message };
  if ((count ?? 0) > 0) return { ok: true };

  const courts = t.court_count != null && t.court_count >= 1 ? t.court_count : 1;
  const rows = buildMatchInsertRows(
    tournamentId,
    t.modus_key || "rr_1",
    n,
    courts,
  );

  if (rows.length === 0) return { ok: true };

  const { error: ie } = await supabase.from("tournament_matches").insert(rows);
  if (ie) return { ok: false, error: ie.message };

  // Kein revalidatePath: Diese Funktion wird beim Rendern der Detailseite aufgerufen;
  // revalidatePath ist dort nicht erlaubt. Die gleiche Response lädt die Spiele ohnehin neu.
  return { ok: true };
}

export async function saveMatchResult(
  tournamentId: string,
  matchId: string,
  goalsHome: number | null,
  goalsAway: number | null,
): Promise<PlanActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  const clearing = goalsHome === null && goalsAway === null;
  if (!clearing) {
    if (
      goalsHome === null ||
      goalsAway === null ||
      !Number.isFinite(goalsHome) ||
      !Number.isFinite(goalsAway)
    ) {
      return { ok: false, error: "Ungültiges Ergebnis." };
    }
    if (goalsHome < 0 || goalsAway < 0) {
      return { ok: false, error: "Tore dürfen nicht negativ sein." };
    }
  }

  const { data: t } = await supabase
    .from("tournaments")
    .select("user_id")
    .eq("id", tournamentId)
    .maybeSingle();

  if (!t || t.user_id !== user.id) {
    return { ok: false, error: "Kein Zugriff." };
  }

  const { data: m, error: me } = await supabase
    .from("tournament_matches")
    .select("id")
    .eq("id", matchId)
    .eq("tournament_id", tournamentId)
    .maybeSingle();

  if (me || !m) return { ok: false, error: "Spiel nicht gefunden." };

  const { error: ue } = await supabase
    .from("tournament_matches")
    .update({
      goals_home: clearing ? null : Math.floor(goalsHome as number),
      goals_away: clearing ? null : Math.floor(goalsAway as number),
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId);

  if (ue) return { ok: false, error: ue.message };

  revalidatePath(`/turniere/${tournamentId}`);
  return { ok: true };
}

/** Setzt alle Spielergebnisse des Turniers zurück (Vorrunde & KO). */
export async function resetTournamentResults(
  tournamentId: string,
): Promise<PlanActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  const { data: t } = await supabase
    .from("tournaments")
    .select("user_id")
    .eq("id", tournamentId)
    .maybeSingle();

  if (!t || t.user_id !== user.id) {
    return { ok: false, error: "Kein Zugriff." };
  }

  const { error } = await supabase
    .from("tournament_matches")
    .update({
      goals_home: null,
      goals_away: null,
      updated_at: new Date().toISOString(),
    })
    .eq("tournament_id", tournamentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/turniere/${tournamentId}`);
  return { ok: true };
}
