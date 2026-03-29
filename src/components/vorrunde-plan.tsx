"use client";

import { saveMatchResult } from "@/app/(app)/turniere/plan-actions";
import {
  computeGroupStandings,
  type GroupStandingRow,
  type StandingMatch,
} from "@/lib/group-standings";
import {
  computeKoMatchDisplays,
  type KoDisplaySide,
  type KoStandingsBlock,
} from "@/lib/ko-display-resolve";
import type { CountingMode } from "@/lib/tournament-modes";
import type {
  GroupPointsPresetId,
  GroupRankingRuleId,
} from "@/lib/tournament-rules";
import type { TournamentMatchRow } from "@/types/tournament-match";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type VorrundeSegmentInfo = {
  label: string;
  groupCode: string;
  slots: number[];
};

type Props = {
  tournamentId: string;
  firstMatchNumber: number;
  participantNames: string[];
  segments: VorrundeSegmentInfo[];
  initialMatches: TournamentMatchRow[];
  rankingRule: GroupRankingRuleId;
  pointsPreset: GroupPointsPresetId;
  countingMode: CountingMode;
  h2hIncludesGdGf: boolean;
};

const DEBOUNCE_MS = 450;

function displayName(names: string[], slot: number): string {
  const s = String(names[slot] ?? "").trim();
  return s || `${slot + 1}. Teilnehmer`;
}

function matchSideLabel(
  names: string[],
  slot: number | null,
  label: string | null | undefined,
): string {
  const t = String(label ?? "").trim();
  if (t) return t;
  if (slot != null) return displayName(names, slot);
  return "—";
}

const cardShell =
  "rounded-2xl bg-app-card/70 p-5 shadow-sm ring-1 ring-app-border/60 sm:p-6";

const inputScoreClass =
  "w-11 rounded-xl border border-app-border/90 bg-app-card px-2 py-2 text-center text-sm font-medium text-app-ink tabular-nums shadow-sm outline-none transition focus:border-app-primary focus:ring-2 focus:ring-app-ring/40";

const thSchedule =
  "border-b border-app-border/70 bg-app-surface/85 px-3 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-app-muted first:pl-4 last:pr-4 sm:px-4";
const tdSchedule =
  "border-b border-app-border/40 px-3 py-3 text-sm text-app-ink first:pl-4 last:pr-4 sm:px-4";

const thTable =
  "border-b border-app-border/70 bg-app-surface/85 px-2 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-app-muted first:pl-3 last:pr-3 sm:px-3";
const thTableNum =
  "border-b border-app-border/70 bg-app-surface/85 px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-app-muted sm:px-2";
const tdTable =
  "border-b border-app-border/35 px-2 py-2.5 text-sm first:pl-3 last:pr-3 sm:px-3";
const tdTableNum =
  "border-b border-app-border/35 px-2 py-2.5 text-center text-sm tabular-nums sm:px-2";

export function VorrundePlan({
  tournamentId,
  firstMatchNumber,
  participantNames,
  segments,
  initialMatches,
  rankingRule,
  pointsPreset,
  countingMode,
  h2hIncludesGdGf,
}: Props) {
  const [matches, setMatches] = useState(initialMatches);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { h: string; a: string }>>(
    () => {
      const d: Record<string, { h: string; a: string }> = {};
      for (const m of initialMatches) {
        d[m.id] = {
          h: m.goals_home != null ? String(m.goals_home) : "",
          a: m.goals_away != null ? String(m.goals_away) : "",
        };
      }
      return d;
    },
  );

  const draftsRef = useRef(drafts);
  const matchesRef = useRef(matches);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout> | undefined>>(
    {},
  );

  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  useEffect(() => {
    matchesRef.current = matches;
  }, [matches]);

  useEffect(() => {
    setMatches(initialMatches);
    matchesRef.current = initialMatches;
    const d: Record<string, { h: string; a: string }> = {};
    for (const m of initialMatches) {
      d[m.id] = {
        h: m.goals_home != null ? String(m.goals_home) : "",
        a: m.goals_away != null ? String(m.goals_away) : "",
      };
    }
    setDrafts(d);
    draftsRef.current = d;
  }, [initialMatches]);

  useEffect(() => {
    return () => {
      for (const t of Object.values(timersRef.current)) {
        if (t) clearTimeout(t);
      }
      timersRef.current = {};
    };
  }, []);

  const persistDraft = useCallback(
    async (row: TournamentMatchRow, h: string, a: string) => {
      if (h === "" && a === "") {
        if (row.goals_home == null && row.goals_away == null) return;

        const res = await saveMatchResult(tournamentId, row.id, null, null);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setError(null);
        setMatches((prev) =>
          prev.map((x) =>
            x.id === row.id
              ? { ...x, goals_home: null, goals_away: null }
              : x,
          ),
        );
        return;
      }

      if (h === "" || a === "") return;
      const gh = parseInt(h, 10);
      const ga = parseInt(a, 10);
      if (!Number.isFinite(gh) || !Number.isFinite(ga) || gh < 0 || ga < 0) {
        return;
      }

      const lastH = row.goals_home;
      const lastA = row.goals_away;
      if (lastH === gh && lastA === ga) return;

      const res = await saveMatchResult(tournamentId, row.id, gh, ga);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setError(null);
      setMatches((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? { ...x, goals_home: gh, goals_away: ga }
            : x,
        ),
      );
    },
    [tournamentId],
  );

  const schedulePersist = useCallback((matchId: string) => {
    const prevT = timersRef.current[matchId];
    if (prevT) clearTimeout(prevT);
    timersRef.current[matchId] = setTimeout(() => {
      delete timersRef.current[matchId];
      const dr = draftsRef.current[matchId];
      const row = matchesRef.current.find((x) => x.id === matchId);
      if (!dr || !row) return;
      void persistDraft(row, dr.h, dr.a);
    }, DEBOUNCE_MS);
  }, [persistDraft]);

  const flushPersist = useCallback(
    (matchId: string) => {
      const prevT = timersRef.current[matchId];
      if (prevT) clearTimeout(prevT);
      delete timersRef.current[matchId];
      const dr = draftsRef.current[matchId];
      const row = matchesRef.current.find((x) => x.id === matchId);
      if (!dr || !row) return;
      void persistDraft(row, dr.h, dr.a);
    },
    [persistDraft],
  );

  const groupMatches = useMemo(
    () => matches.filter((m) => (m.match_phase ?? "group") === "group"),
    [matches],
  );

  const koMatches = useMemo(
    () => matches.filter((m) => m.match_phase === "ko"),
    [matches],
  );

  const standingMatches: StandingMatch[] = useMemo(
    () =>
      matches
        .filter(
          (m) =>
            (m.match_phase ?? "group") === "group" &&
            m.slot_home != null &&
            m.slot_away != null,
        )
        .map((m) => ({
          slot_home: m.slot_home as number,
          slot_away: m.slot_away as number,
          goals_home: m.goals_home,
          goals_away: m.goals_away,
        })),
    [matches],
  );

  const standingsBlocks: (KoStandingsBlock & { label: string })[] = useMemo(
    () =>
      segments.map((seg) => ({
        label: seg.label,
        groupCode: seg.groupCode,
        rows: computeGroupStandings(
          seg.slots,
          participantNames,
          standingMatches,
          rankingRule,
          pointsPreset,
          countingMode,
          h2hIncludesGdGf,
        ),
      })),
    [
      segments,
      participantNames,
      standingMatches,
      rankingRule,
      pointsPreset,
      countingMode,
      h2hIncludesGdGf,
    ],
  );

  /** Entwürfe einbeziehen, damit KO-Namen (Sieger VF …) schon vor dem Speichern mitziehen. */
  const koMatchesForDisplay = useMemo(
    () =>
      koMatches.map((m) => {
        const dr = drafts[m.id];
        let goals_home = m.goals_home;
        let goals_away = m.goals_away;
        if (dr && dr.h !== "" && dr.a !== "") {
          const ph = parseInt(dr.h, 10);
          const pa = parseInt(dr.a, 10);
          if (
            Number.isFinite(ph) &&
            Number.isFinite(pa) &&
            ph >= 0 &&
            pa >= 0
          ) {
            goals_home = ph;
            goals_away = pa;
          }
        }
        return { ...m, goals_home, goals_away };
      }),
    [koMatches, drafts],
  );

  const koDisplayById = useMemo(
    () =>
      koMatchesForDisplay.length > 0
        ? computeKoMatchDisplays(
            koMatchesForDisplay,
            standingsBlocks,
            participantNames,
            countingMode,
          )
        : new Map<string, { home: KoDisplaySide; away: KoDisplaySide }>(),
    [
      koMatchesForDisplay,
      standingsBlocks,
      participantNames,
      countingMode,
    ],
  );

  if (matches.length === 0) {
    return (
      <p className="text-sm text-app-muted">
        Noch keine Spiele angelegt (mindestens zwei Teilnehmer nötig).
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p
          className="rounded-xl border border-red-200/90 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12 lg:items-start">
        <div className="min-w-0 space-y-6">
          <div className={cardShell}>
            <h3 className="mb-5 text-sm font-semibold tracking-wide text-app-ink">
              Vorrunde — Ergebnisse
            </h3>
            <div className="-mx-1 overflow-x-auto sm:mx-0">
              <table className="w-full min-w-[420px] border-collapse text-left">
                <thead>
                  <tr className="shadow-sm shadow-app-ink/5">
                    <th className={thSchedule}>Nr.</th>
                    <th className={thSchedule}>Feld</th>
                    <th className={thSchedule}>Gr.</th>
                    <th className={thSchedule}>Spiel</th>
                    <th className={thSchedule + " min-w-[6.5rem]"}>Ergebnis</th>
                  </tr>
                </thead>
                <tbody className="bg-app-card/40">
                  {groupMatches.map((m, rowIdx) => {
                    const dr = drafts[m.id] ?? { h: "", a: "" };
                    const nr = firstMatchNumber + m.sort_index;
                    const gLabel = m.group_code || "—";
                    const home = matchSideLabel(
                      participantNames,
                      m.slot_home,
                      m.label_home,
                    );
                    const away = matchSideLabel(
                      participantNames,
                      m.slot_away,
                      m.label_away,
                    );
                    const zebra =
                      rowIdx % 2 === 0 ? "bg-app-card/80" : "bg-app-surface/20";
                    return (
                      <tr key={m.id} className={zebra}>
                        <td className={tdSchedule + " tabular-nums text-app-muted"}>
                          {nr}
                        </td>
                        <td className={tdSchedule + " tabular-nums text-app-muted"}>
                          {m.pitch}
                        </td>
                        <td className={tdSchedule}>
                          <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-md bg-app-surface/90 px-1.5 py-0.5 text-xs font-semibold text-app-ink ring-1 ring-app-border/60">
                            {gLabel}
                          </span>
                        </td>
                        <td className={tdSchedule}>
                          <span className="font-medium text-app-ink">{home}</span>
                          <span className="mx-1.5 text-app-subtle">vs.</span>
                          <span className="font-medium text-app-ink">{away}</span>
                        </td>
                        <td className={tdSchedule}>
                          <div className="flex items-center justify-end gap-2 sm:justify-start">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={dr.h}
                              onChange={(e) => {
                                const v = e.target.value.replace(/\D/g, "");
                                setDrafts((prev) => {
                                  const next = {
                                    ...prev,
                                    [m.id]: {
                                      ...prev[m.id],
                                      h: v,
                                      a: prev[m.id]?.a ?? "",
                                    },
                                  };
                                  draftsRef.current = next;
                                  return next;
                                });
                                schedulePersist(m.id);
                              }}
                              onBlur={() => flushPersist(m.id)}
                              className={inputScoreClass}
                              aria-label={`Tore ${home}`}
                            />
                            <span className="select-none text-app-subtle">:</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={dr.a}
                              onChange={(e) => {
                                const v = e.target.value.replace(/\D/g, "");
                                setDrafts((prev) => {
                                  const next = {
                                    ...prev,
                                    [m.id]: { h: prev[m.id]?.h ?? "", a: v },
                                  };
                                  draftsRef.current = next;
                                  return next;
                                });
                                schedulePersist(m.id);
                              }}
                              onBlur={() => flushPersist(m.id)}
                              className={inputScoreClass}
                              aria-label={`Tore ${away}`}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {koMatches.length > 0 ? (
            <div className={cardShell}>
              <h3 className="mb-5 text-sm font-semibold tracking-wide text-app-ink">
                Final- / K.O.-Runde
              </h3>
              <p className="mb-4 text-xs text-app-muted/90">
                Platzhalter werden aus Vorrunden-Tabellen und Sieger der
                Vorpartien ergänzt, sobald die Ergebnisse da sind.
              </p>
              <div className="-mx-1 overflow-x-auto sm:mx-0">
                <table className="w-full min-w-[420px] border-collapse text-left">
                  <thead>
                    <tr className="shadow-sm shadow-app-ink/5">
                      <th className={thSchedule}>Nr.</th>
                      <th className={thSchedule}>Feld</th>
                      <th className={thSchedule}>Runde</th>
                      <th className={thSchedule}>Spiel</th>
                      <th className={thSchedule + " min-w-[6.5rem]"}>Ergebnis</th>
                    </tr>
                  </thead>
                  <tbody className="bg-app-card/40">
                    {koMatches.map((m, rowIdx) => {
                      const dr = drafts[m.id] ?? { h: "", a: "" };
                      const nr = firstMatchNumber + m.sort_index;
                      const gLabel = m.group_code || "—";
                      const disp = koDisplayById.get(m.id);
                      const homeDisp = disp?.home ?? {
                        primary: matchSideLabel(
                          participantNames,
                          m.slot_home,
                          m.label_home,
                        ),
                        resolved: true,
                      };
                      const awayDisp = disp?.away ?? {
                        primary: matchSideLabel(
                          participantNames,
                          m.slot_away,
                          m.label_away,
                        ),
                        resolved: true,
                      };
                      const zebra =
                        rowIdx % 2 === 0 ? "bg-app-card/80" : "bg-app-surface/20";
                      return (
                        <tr key={m.id} className={zebra}>
                          <td className={tdSchedule + " tabular-nums text-app-muted"}>
                            {nr}
                          </td>
                          <td className={tdSchedule + " tabular-nums text-app-muted"}>
                            {m.pitch}
                          </td>
                          <td className={tdSchedule}>
                            <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-md bg-app-surface/90 px-1.5 py-0.5 text-xs font-semibold text-app-ink ring-1 ring-app-border/60">
                              {gLabel}
                            </span>
                          </td>
                          <td className={tdSchedule}>
                            <span
                              className={
                                homeDisp.resolved
                                  ? "font-medium text-app-ink"
                                  : "font-medium text-app-ink/45"
                              }
                            >
                              {homeDisp.primary}
                            </span>
                            <span className="mx-1.5 text-app-subtle/80">vs.</span>
                            <span
                              className={
                                awayDisp.resolved
                                  ? "font-medium text-app-ink"
                                  : "font-medium text-app-ink/45"
                              }
                            >
                              {awayDisp.primary}
                            </span>
                          </td>
                          <td className={tdSchedule}>
                            <div className="flex items-center justify-end gap-2 sm:justify-start">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={dr.h}
                                onChange={(e) => {
                                  const v = e.target.value.replace(/\D/g, "");
                                  setDrafts((prev) => {
                                    const next = {
                                      ...prev,
                                      [m.id]: {
                                        ...prev[m.id],
                                        h: v,
                                        a: prev[m.id]?.a ?? "",
                                      },
                                    };
                                    draftsRef.current = next;
                                    return next;
                                  });
                                  schedulePersist(m.id);
                                }}
                                onBlur={() => flushPersist(m.id)}
                                className={inputScoreClass}
                                aria-label={`Tore ${homeDisp.primary}`}
                              />
                              <span className="select-none text-app-subtle">:</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={dr.a}
                                onChange={(e) => {
                                  const v = e.target.value.replace(/\D/g, "");
                                  setDrafts((prev) => {
                                    const next = {
                                      ...prev,
                                      [m.id]: { h: prev[m.id]?.h ?? "", a: v },
                                    };
                                    draftsRef.current = next;
                                    return next;
                                  });
                                  schedulePersist(m.id);
                                }}
                                onBlur={() => flushPersist(m.id)}
                                className={inputScoreClass}
                                aria-label={`Tore ${awayDisp.primary}`}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        <div className={`min-w-0 space-y-8 ${cardShell}`}>
          <h3 className="text-sm font-semibold tracking-wide text-app-ink">
            Tabellen Vorrunde
          </h3>
          <div className="space-y-7">
            {standingsBlocks.map((block) => (
              <div key={block.label}>
                <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-app-subtle">
                  {block.label}
                </p>
                <div className="overflow-x-auto rounded-xl ring-1 ring-app-border/55">
                  <table className="w-full table-fixed min-w-[280px] border-collapse bg-app-card/40">
                    <colgroup>
                      <col className="w-10 sm:w-11" />
                      <col />
                      <col className="w-9 sm:w-10" />
                      <col className="w-[4.5rem] sm:w-20" />
                      <col className="w-10 sm:w-11" />
                      <col className="w-10 sm:w-11" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className={thTableNum}>Pl</th>
                        <th className={thTable}>Teilnehmer</th>
                        <th className={thTableNum}>Sp</th>
                        <th className={thTableNum}>T</th>
                        <th className={thTableNum}>TD</th>
                        <th className={thTableNum}>Pkt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((r, i) => (
                        <tr
                          key={r.slot}
                          className={
                            i % 2 === 0
                              ? "bg-app-card/85"
                              : "bg-app-surface/25"
                          }
                        >
                          <td className={tdTableNum + " text-app-muted"}>
                            {r.rank}
                          </td>
                          <td className={tdTable + " font-medium text-app-ink"}>
                            {r.name}
                          </td>
                          <td className={tdTableNum}>{r.played}</td>
                          <td className={tdTableNum}>
                            {r.goalsFor}&nbsp;:&nbsp;{r.goalsAgainst}
                          </td>
                          <td className={tdTableNum}>
                            {r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}
                          </td>
                          <td className={tdTableNum + " text-base font-semibold text-app-primary"}>
                            {r.points % 1 === 0
                              ? String(r.points)
                              : r.points.toFixed(1).replace(/\.0$/, "")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
