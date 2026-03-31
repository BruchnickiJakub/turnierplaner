import type { TournamentMatchRow } from "@/types/tournament-match";

/** Parst eine Spielzeile aus RPC/JSON (Zuschauer, API). */
export function tournamentMatchFromJson(o: unknown): TournamentMatchRow | null {
  if (!o || typeof o !== "object") return null;
  const r = o as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.tournament_id !== "string") {
    return null;
  }
  return {
    id: r.id,
    tournament_id: r.tournament_id,
    sort_index: Number(r.sort_index ?? 0),
    match_phase: r.match_phase === "ko" ? "ko" : "group",
    group_code: String(r.group_code ?? ""),
    pitch: Number(r.pitch ?? 1),
    start_time: r.start_time == null ? null : String(r.start_time),
    slot_home: r.slot_home == null ? null : Number(r.slot_home),
    slot_away: r.slot_away == null ? null : Number(r.slot_away),
    label_home:
      r.label_home == null || r.label_home === undefined
        ? null
        : String(r.label_home),
    label_away:
      r.label_away == null || r.label_away === undefined
        ? null
        : String(r.label_away),
    goals_home: r.goals_home == null ? null : Number(r.goals_home),
    goals_away: r.goals_away == null ? null : Number(r.goals_away),
    is_active: Boolean(r.is_active),
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? ""),
  };
}

export function tournamentMatchesFromJsonArray(raw: unknown): TournamentMatchRow[] {
  if (!Array.isArray(raw)) return [];
  const out: TournamentMatchRow[] = [];
  for (const x of raw) {
    const m = tournamentMatchFromJson(x);
    if (m) out.push(m);
  }
  return out;
}
