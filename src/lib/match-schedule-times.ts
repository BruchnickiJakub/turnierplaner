/** ISO-Zeitstring für DB; Anzeige für Tabellen. */
export function formatMatchStartDisplay(
  value: string | null | undefined,
): string {
  if (value == null || value === "") return "—";
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    return new Intl.DateTimeFormat("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  }
  return String(value);
}

export type MatchRowForSchedule = {
  sort_index: number;
  match_phase: string;
  pitch: number;
  start_time: string | null;
};

/**
 * Weist jedem Spiel eine Startzeit zu: Spielfeldweise fortschreitend nach
 * sort_index, Dauer abhängig von Vorrunde vs. K.O.
 */
export function assignMatchStartTimes<T extends MatchRowForSchedule>(
  rows: T[],
  opts: {
    tournamentStartAt: Date;
    groupMatchDurationMinutes: number;
    koMatchDurationMinutes: number;
    courtCount: number;
  },
): T[] {
  const courts = Math.min(99, Math.max(1, Math.floor(opts.courtCount)));
  const base = opts.tournamentStartAt.getTime();
  if (!Number.isFinite(base)) {
    return rows.map((r) => ({ ...r }));
  }

  const gMin = Math.max(1, Math.floor(opts.groupMatchDurationMinutes));
  const kMin = Math.max(1, Math.floor(opts.koMatchDurationMinutes));

  const sorted = [...rows].sort((a, b) => a.sort_index - b.sort_index);
  const free = new Map<number, number>();
  for (let p = 1; p <= courts; p++) {
    free.set(p, base);
  }

  const copies = sorted.map((r) => ({ ...r }));
  for (const row of copies) {
    const pitch = Math.min(courts, Math.max(1, Math.floor(row.pitch)));
    const durMin = row.match_phase === "ko" ? kMin : gMin;
    const durMs = durMin * 60_000;
    const t0 = free.get(pitch) ?? base;
    row.start_time = new Date(t0).toISOString();
    free.set(pitch, t0 + durMs);
  }

  const bySortIndex = new Map(copies.map((c) => [c.sort_index, c]));
  return rows.map((r) => {
    const u = bySortIndex.get(r.sort_index);
    return u ? { ...r, start_time: u.start_time } : { ...r };
  });
}
