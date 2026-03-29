"use client";

import {
  saveTournament,
  type TournamentPayload,
} from "@/app/(app)/turniere/actions";
import {
  GROUP_POINTS_PRESET_OPTIONS,
  GROUP_RANKING_RULE_OPTIONS,
  normalizeGroupPointsPreset,
  normalizeGroupRankingRule,
  type GroupPointsPresetId,
  type GroupRankingRuleId,
} from "@/lib/tournament-rules";
import {
  COUNTING_MODE_LABEL,
  type CountingMode,
  getAvailableModi,
  getGroupLayout,
  getModusLabel,
  groupModiByCategory,
  parseParticipantNames,
} from "@/lib/tournament-modes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const inputClass =
  "w-full rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-app-ink outline-none transition focus:border-app-primary focus:ring-2 focus:ring-app-ring/40";
const labelClass = "text-sm font-medium text-app-ink";
const hintClass = "mt-0.5 text-xs text-app-muted";
const btnPrimary =
  "inline-flex items-center justify-center rounded-xl bg-app-primary px-5 py-2.5 text-sm font-medium text-app-card shadow-md shadow-app-primary/20 transition hover:bg-app-primary-hover disabled:opacity-60";
const btnOutline =
  "inline-flex items-center justify-center rounded-xl border border-app-border bg-app-card px-5 py-2.5 text-sm font-medium text-app-ink shadow-sm transition hover:border-app-primary/40";
const btnMuted =
  "inline-flex items-center justify-center rounded-xl border border-app-border/80 bg-app-surface/50 px-5 py-2.5 text-sm font-medium text-app-muted transition hover:bg-app-surface";

const btnRandomGenerate =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-app-border/90 bg-gradient-to-b from-app-card to-app-surface/80 px-5 py-2.5 text-sm font-semibold text-app-ink shadow-sm ring-1 ring-app-border/40 transition duration-200 hover:-translate-y-0.5 hover:border-app-primary/50 hover:from-app-card hover:to-app-primary/[0.07] hover:shadow-md hover:shadow-app-primary/15 hover:ring-app-primary/25 active:translate-y-0 active:shadow-sm disabled:opacity-60";

type Initial = {
  id?: string;
  title?: string;
  participantCount?: number;
  modusKey?: string | null;
  countingMode?: CountingMode | string | null;
  courtCount?: number | null;
  groupRankingRule?: string | null;
  h2hIncludesGdGf?: boolean | null;
  groupPointsPreset?: string | null;
  participantNames?: unknown;
};

type Props = {
  mode: "create" | "edit";
  initial?: Initial | null;
};

function resizeNames(prev: string[], n: number): string[] {
  const next = prev.slice(0, n);
  while (next.length < n) next.push("");
  return next;
}

export function TournamentWizard({ mode, initial }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [participantCount, setParticipantCount] = useState(
    String(initial?.participantCount ?? 8),
  );

  const [modusKey, setModusKey] = useState(initial?.modusKey ?? "");
  const [countingMode, setCountingMode] = useState<CountingMode>(
    initial?.countingMode === "wins_only" ? "wins_only" : "goals",
  );

  const [courtCount, setCourtCount] = useState(
    String(
      initial?.courtCount != null && initial.courtCount >= 1
        ? initial.courtCount
        : 1,
    ),
  );
  const [groupRankingRule, setGroupRankingRule] =
    useState<GroupRankingRuleId>(
      normalizeGroupRankingRule(initial?.groupRankingRule ?? undefined),
    );
  const [h2hIncludesGdGf, setH2hIncludesGdGf] = useState(
    Boolean(initial?.h2hIncludesGdGf),
  );
  const [groupPointsPreset, setGroupPointsPreset] =
    useState<GroupPointsPresetId>(
      normalizeGroupPointsPreset(initial?.groupPointsPreset ?? undefined),
    );

  const n = useMemo(() => {
    const v = parseInt(participantCount, 10);
    return Number.isFinite(v) ? v : 0;
  }, [participantCount]);

  const [names, setNames] = useState<string[]>(() =>
    initial?.participantCount
      ? parseParticipantNames(
          initial.participantNames,
          initial.participantCount,
        )
      : [],
  );

  const [shuffleBurst, setShuffleBurst] = useState(false);
  const shuffleBurstClearRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const availableModi = useMemo(() => getAvailableModi(n), [n]);
  const groupedModi = useMemo(
    () => groupModiByCategory(availableModi),
    [availableModi],
  );

  const segments = useMemo(
    () => getGroupLayout(modusKey || "rr_1", n),
    [modusKey, n],
  );

  useEffect(() => {
    if (!modusKey) return;
    if (!availableModi.some((m) => m.id === modusKey)) {
      setModusKey("");
    }
  }, [availableModi, modusKey]);

  useEffect(() => {
    return () => {
      if (shuffleBurstClearRef.current) {
        clearTimeout(shuffleBurstClearRef.current);
      }
    };
  }, []);

  function goNextFrom1() {
    setError(null);
    if (!title.trim()) {
      setError("Bitte einen Turniernamen eingeben.");
      return;
    }
    if (n < 2) {
      setError("Mindestens 2 Teilnehmer.");
      return;
    }
    if (!modusKey) {
      setError("Bitte einen Modus wählen.");
      return;
    }
    if (!availableModi.some((m) => m.id === modusKey)) {
      setError("Dieser Modus ist bei dieser Teilnehmerzahl nicht verfügbar.");
      return;
    }
    setNames((prev) => resizeNames(prev, n));
    setStep(2);
  }

  useEffect(() => {
    if (step !== 2 || n < 1) return;
    setNames((prev) => resizeNames(prev, n));
  }, [n, step]);

  async function submitFinal() {
    setError(null);
    if (names.length !== n) {
      setError("Teilnehmerliste passt nicht zur Teilnehmerzahl.");
      return;
    }
    setSaving(true);
    const cc = parseInt(courtCount, 10);
    const payload: TournamentPayload = {
      title: title.trim(),
      participantCount: n,
      modusKey,
      bestPlacement: 1,
      firstMatchNumber: 1,
      countingMode,
      courtCount: Number.isFinite(cc) && cc >= 1 ? cc : 1,
      groupRankingRule,
      h2hIncludesGdGf,
      groupPointsPreset,
      participantNames: names,
    };
    if (initial?.id) {
      payload.id = initial.id;
    }

    const res = await saveTournament(payload);
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const targetId = res.id ?? initial?.id;
    if (targetId) {
      router.push(`/turniere/${targetId}`);
    } else {
      router.push("/turniere");
    }
    router.refresh();
  }

  function randomizeParticipantGroups() {
    if (shuffleBurstClearRef.current) {
      clearTimeout(shuffleBurstClearRef.current);
      shuffleBurstClearRef.current = null;
    }
    setShuffleBurst(false);
    setNames((prev) => {
      const arr = resizeNames(prev, n);
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i]!;
        arr[i] = arr[j]!;
        arr[j] = tmp;
      }
      return arr;
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setShuffleBurst(true);
        shuffleBurstClearRef.current = setTimeout(() => {
          setShuffleBurst(false);
          shuffleBurstClearRef.current = null;
        }, 820);
      });
    });
  }

  function step2Toolbar() {
    return (
      <div className="mt-10 flex flex-wrap gap-3 border-t border-app-border/70 pt-8">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={btnOutline}
        >
          Zurück
        </button>
        <button
          type="button"
          onClick={submitFinal}
          disabled={saving}
          className={btnPrimary}
        >
          {saving
            ? "Speichern…"
            : mode === "edit"
              ? "Speichern"
              : "Speichern und Turnier anlegen"}
        </button>
      </div>
    );
  }

  const tableHeadClass =
    "border border-app-border bg-app-surface/90 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-app-muted";
  const tableCellClass = "border border-app-border p-0 align-middle";
  const nrCellClass =
    "border border-app-border bg-app-card px-3 py-2 text-center text-sm text-app-muted w-14";

  return (
    <div className="w-full">
      <h2 className="text-center text-lg font-semibold text-app-ink">
        {title.trim() || "Neues Turnier"}
      </h2>
      <p className="mt-2 text-center text-sm text-app-muted">
        {step === 1 ? (
          <>
            <span className="font-semibold text-app-primary">
              Allgemeines &amp; Modus
            </span>
            {" · "}
            Teilnehmer
          </>
        ) : (
          <>
            Allgemeines &amp; Modus ·{" "}
            <span className="font-semibold text-app-primary">Teilnehmer</span>
          </>
        )}
      </p>

      <div className="my-6 flex gap-2">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition ${
              s <= step ? "bg-app-primary" : "bg-app-border"
            }`}
          />
        ))}
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-app-subtle">
        Phase {step} von 2
      </p>

      {error ? (
        <p
          className="mt-4 rounded-xl border border-red-200/80 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {step === 1 ? (
        <div className="mt-6 grid gap-6 lg:max-w-3xl">
          <div>
            <label htmlFor="tw-title" className={labelClass}>
              Name des Turniers <span className="text-app-accent">*</span>
            </label>
            <input
              id="tw-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`${inputClass} mt-1.5`}
            />
          </div>
          <div>
            <label htmlFor="tw-n" className={labelClass}>
              Anzahl Teilnehmer <span className="text-app-accent">*</span>
            </label>
            <input
              id="tw-n"
              type="number"
              min={2}
              max={512}
              value={participantCount}
              onChange={(e) => setParticipantCount(e.target.value)}
              className={`${inputClass} mt-1.5 max-w-[12rem]`}
            />
            <p className={hintClass}>
              Bestimmt verfügbare Modi und die Einteilung in Gruppen in Phase 2.
            </p>
          </div>

          <div>
            <label htmlFor="tw-modus" className={labelClass}>
              Modus
            </label>
            <p className={hintClass}>
              Nur Modi, die bei {n || "…"} Teilnehmern möglich sind.
            </p>
            <select
              id="tw-modus"
              value={modusKey}
              onChange={(e) => setModusKey(e.target.value)}
              className={`${inputClass} mt-2 font-sans`}
            >
              <option value="">Bitte wählen …</option>
              {groupedModi.map((g) => (
                <optgroup key={g.category} label={g.title}>
                  {g.items.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-x-10 sm:gap-y-0 lg:gap-x-12">
            <label
              htmlFor="tw-count"
              className={`${labelClass} shrink-0 sm:max-w-[13.5rem] sm:leading-snug`}
            >
              Zählmodus (Tore oder Nur Siege)
            </label>
            <select
              id="tw-count"
              value={countingMode}
              onChange={(e) =>
                setCountingMode(
                  e.target.value === "wins_only" ? "wins_only" : "goals",
                )
              }
              className={`${inputClass} w-full max-w-md sm:flex-1 sm:min-w-[12rem]`}
            >
              {(Object.keys(COUNTING_MODE_LABEL) as CountingMode[]).map((k) => (
                <option key={k} value={k}>
                  {COUNTING_MODE_LABEL[k]}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-app-border/90 bg-app-surface/40 p-6 shadow-sm ring-1 ring-app-border/30">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-app-subtle">
              Turnier-Einstellungen
            </h3>
            <p className="mt-1 text-sm text-app-muted">
              Regeln für die Gruppenphase und Spielfelder.
            </p>

            <div className="mt-6 space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-x-10 sm:gap-y-0 lg:gap-x-12">
                <label
                  htmlFor="tw-courts"
                  className={`${labelClass} shrink-0 sm:max-w-[13.5rem]`}
                >
                  Anzahl Spielfelder
                </label>
                <input
                  id="tw-courts"
                  type="number"
                  min={1}
                  max={99}
                  value={courtCount}
                  onChange={(e) => setCourtCount(e.target.value)}
                  className={`${inputClass} w-full max-w-[12rem] sm:flex-1 sm:min-w-[8rem]`}
                />
              </div>

              <div>
                <label htmlFor="tw-rank-rule" className={labelClass}>
                  Platzierungsregel in Gruppen
                </label>
                <select
                  id="tw-rank-rule"
                  value={groupRankingRule}
                  onChange={(e) =>
                    setGroupRankingRule(
                      normalizeGroupRankingRule(e.target.value),
                    )
                  }
                  className={`${inputClass} mt-2 font-sans`}
                >
                  {GROUP_RANKING_RULE_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <label className="group flex cursor-pointer items-start gap-3.5 py-1">
                <input
                  type="checkbox"
                  checked={h2hIncludesGdGf}
                  onChange={(e) => setH2hIncludesGdGf(e.target.checked)}
                  className="mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 cursor-pointer rounded-xl border-2 border-app-border/90 text-app-primary accent-app-primary focus:ring-2 focus:ring-app-ring/35 focus:ring-offset-2 focus:ring-offset-app-surface/40"
                />
                <span className="text-sm leading-relaxed text-app-ink transition group-hover:text-app-ink/90">
                  Direkter Vergleich berücksichtigt Tordifferenz und
                  geschossene Tore
                </span>
              </label>

              <div>
                <label htmlFor="tw-group-pts" className={labelClass}>
                  Punkte für Siege, Unentschieden und Niederlagen während der
                  Gruppenphase
                </label>
                <select
                  id="tw-group-pts"
                  value={groupPointsPreset}
                  onChange={(e) =>
                    setGroupPointsPreset(
                      normalizeGroupPointsPreset(e.target.value),
                    )
                  }
                  className={`${inputClass} mt-2 font-sans`}
                >
                  {GROUP_POINTS_PRESET_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/turniere" className={btnMuted}>
              Abbrechen
            </Link>
            <button type="button" onClick={goNextFrom1} className={btnPrimary}>
              Speichern und weiter
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-6">
          <p className="mb-6 text-sm text-app-muted">
            {n} Teilnehmer · {getModusLabel(modusKey)}
          </p>

          <div
            className={`space-y-8 transition-shadow duration-300 ${
              shuffleBurst ? "tw-shuffle-shell-active" : ""
            }`}
          >
            {segments.map((seg, segIndex) => {
              const start = segments
                .slice(0, segIndex)
                .reduce((acc, g) => acc + g.size, 0);
              return (
                <div key={`${seg.label}-${segIndex}`}>
                  <h3 className="mb-3 text-center text-base font-semibold text-app-ink">
                    {seg.label}
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-app-border/90">
                    <table className="w-full min-w-[320px] border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className={tableHeadClass}>Nr.</th>
                          <th className={tableHeadClass}>Teilnehmer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: seg.size }, (_, row) => {
                          const gi = start + row;
                          const displayNr = gi + 1;
                          return (
                            <tr
                              key={gi}
                              className={`bg-app-card odd:bg-app-surface/30 ${
                                shuffleBurst ? "tw-shuffle-row-active" : ""
                              }`}
                              style={
                                shuffleBurst
                                  ? {
                                      animationDelay: `${gi * 42}ms`,
                                    }
                                  : undefined
                              }
                            >
                              <td className={nrCellClass}>{displayNr}</td>
                              <td className={tableCellClass}>
                                <input
                                  type="text"
                                  value={names[gi] ?? ""}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setNames((prev) => {
                                      const nxt = resizeNames(prev, n);
                                      nxt[gi] = v;
                                      return nxt;
                                    });
                                  }}
                                  placeholder={`${displayNr}. Teilnehmer`}
                                  className="h-full w-full min-h-[2.75rem] border-0 bg-transparent px-3 py-2 text-app-ink outline-none focus:ring-2 focus:ring-inset focus:ring-app-ring/30"
                                  autoComplete="off"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={randomizeParticipantGroups}
              className={`group ${btnRandomGenerate} ${
                shuffleBurst ? "tw-shuffle-btn-active" : ""
              }`}
            >
              <span
                aria-hidden
                className="inline-block text-base leading-none text-app-primary transition group-hover:rotate-12"
              >
                ✦
              </span>
              Random generieren
            </button>
          </div>
          <p className="mx-auto mt-2 max-w-md text-center text-xs text-app-muted">
            Verteilt die eingetragenen Namen zufällig auf die Platzhalter
            (Gruppen gemäß Modus).
          </p>

          {step2Toolbar()}
        </div>
      ) : null}
    </div>
  );
}
