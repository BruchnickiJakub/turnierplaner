"use server";

import { buildFullMatchPlan } from "@/lib/build-full-match-plan";
import { assignMatchStartTimes } from "@/lib/match-schedule-times";
import { createClient } from "@/lib/supabase/server";
import type { TournamentRow } from "@/types/tournament";
import { revalidatePath } from "next/cache";

export type PlanActionResult =
  | { ok: true }
  | { ok: false; error: string };

type MatchInsertRow = {
  tournament_id: string;
  sort_index: number;
  match_phase: string;
  group_code: string;
  pitch: number;
  start_time: string | null;
  slot_home: number | null;
  slot_away: number | null;
  label_home: string | null;
  label_away: string | null;
};

function buildMatchInsertRows(
  tournamentId: string,
  modusKey: string,
  teamCount: number,
  courtCount: number,
): MatchInsertRow[] {
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

function enrichMatchRowsWithSchedule(
  rows: MatchInsertRow[],
  t: Pick<
    TournamentRow,
    | "tournament_start_at"
    | "group_match_duration_minutes"
    | "ko_match_duration_minutes"
  >,
  courtCount: number,
): MatchInsertRow[] {
  const raw = t.tournament_start_at;
  if (raw == null || String(raw).trim() === "") return rows;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return rows;

  const g =
    t.group_match_duration_minutes != null &&
    Number.isFinite(t.group_match_duration_minutes) &&
    t.group_match_duration_minutes >= 1
      ? Math.floor(t.group_match_duration_minutes)
      : 15;
  const k =
    t.ko_match_duration_minutes != null &&
    Number.isFinite(t.ko_match_duration_minutes) &&
    t.ko_match_duration_minutes >= 1
      ? Math.floor(t.ko_match_duration_minutes)
      : g;

  return assignMatchStartTimes(rows, {
    tournamentStartAt: d,
    groupMatchDurationMinutes: g,
    koMatchDurationMinutes: k,
    courtCount,
  });
}

function validateDistinctSortIndices(rows: MatchInsertRow[]): string | null {
  const seen = new Set<number>();
  for (const r of rows) {
    if (seen.has(r.sort_index)) {
      return `Interner Fehler: doppelter Spiel-Index (${r.sort_index}). Bitte melden.`;
    }
    seen.add(r.sort_index);
  }
  return null;
}

function isUniqueViolation(err: { message?: string; code?: string }): boolean {
  if (err.code === "23505") return true;
  const m = err.message ?? "";
  return m.includes("duplicate key") || m.includes("unique constraint");
}

type DbClient = Awaited<ReturnType<typeof createClient>>;

/** Löscht alle Spiele des Turniers und fügt neu ein; bei Kollision (z. B. Races) einmal wiederholen. */
async function deleteAllMatchRows(
  supabase: DbClient,
  tournamentId: string,
): Promise<{ error: { message: string } | null }> {
  const { error } = await supabase
    .from("tournament_matches")
    .delete()
    .eq("tournament_id", tournamentId);
  return { error: error ? { message: error.message } : null };
}

async function insertMatchRowsWithRetry(
  supabase: DbClient,
  tournamentId: string,
  rows: MatchInsertRow[],
): Promise<{ error: { message: string } | null }> {
  const run = async () => {
    const del = await deleteAllMatchRows(supabase, tournamentId);
    if (del.error) return del;
    const { error } = await supabase.from("tournament_matches").insert(rows);
    return {
      error: error
        ? { message: error.message, code: error.code }
        : null,
    };
  };

  let out = await run();
  if (out.error && isUniqueViolation(out.error)) {
    out = await run();
  }
  return out;
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
    .select(
      "user_id, tournament_start_at, group_match_duration_minutes, ko_match_duration_minutes",
    )
    .eq("id", tournamentId)
    .maybeSingle();

  if (te || !t) return { ok: false, error: "Turnier nicht gefunden." };
  if (t.user_id !== user.id) return { ok: false, error: "Kein Zugriff." };

  const n = teamCount;
  if (n < 2) {
    const empty = await deleteAllMatchRows(supabase, tournamentId);
    if (empty.error) return { ok: false, error: empty.error.message };
    return { ok: true };
  }

  let rows = buildMatchInsertRows(tournamentId, modusKey, n, courtCount);
  rows = enrichMatchRowsWithSchedule(rows, t as TournamentRow, courtCount);
  if (rows.length === 0) return { ok: true };

  const bad = validateDistinctSortIndices(rows);
  if (bad) return { ok: false, error: bad };

  const { error: ie } = await insertMatchRowsWithRetry(supabase, tournamentId, rows);
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
  let rows = buildMatchInsertRows(
    tournamentId,
    t.modus_key || "rr_1",
    n,
    courts,
  );
  rows = enrichMatchRowsWithSchedule(rows, t, courts);

  if (rows.length === 0) return { ok: true };

  const bad = validateDistinctSortIndices(rows);
  if (bad) return { ok: false, error: bad };

  // Leeren + einfügen: verhindert „duplicate key“, wenn parallel noch Zeilen angelegt wurden
  // oder die Zählung und der echte Zustand kurz auseinanderliegen.
  const { error: ie } = await insertMatchRowsWithRetry(supabase, tournamentId, rows);
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
