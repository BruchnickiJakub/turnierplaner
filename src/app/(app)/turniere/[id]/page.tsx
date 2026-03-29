import { ensureVorrundeSchedule } from "@/app/(app)/turniere/plan-actions";
import { VorrundePlan } from "@/components/vorrunde-plan";
import { segmentLabelToGroupCode } from "@/lib/build-vorrunde-schedule";
import { createClient } from "@/lib/supabase/server";
import type { TournamentRow } from "@/types/tournament";
import type { TournamentMatchRow } from "@/types/tournament-match";
import {
  normalizeGroupPointsPreset,
  normalizeGroupRankingRule,
} from "@/lib/tournament-rules";
import { type CountingMode, getGroupLayout, parseParticipantNames } from "@/lib/tournament-modes";
import { DeleteTournamentForm } from "@/components/delete-tournament-form";
import { ResetTournamentResultsButton } from "@/components/reset-tournament-results-button";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function TurnierDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/anmelden");
  }

  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const t = data as TournamentRow;
  if (t.user_id !== user.id) {
    notFound();
  }

  const cm = (t.counting_mode === "wins_only" ? "wins_only" : "goals") as CountingMode;
  const tn = t.team_count ?? 0;
  const names = parseParticipantNames(t.participant_names, tn);
  const segments = getGroupLayout(t.modus_key || "rr_1", tn);

  const rankId = normalizeGroupRankingRule(t.group_ranking_rule);
  const ptsId = normalizeGroupPointsPreset(t.group_points_preset);

  const schedHint = await ensureVorrundeSchedule(id);

  let matchRows: TournamentMatchRow[] = [];
  let matchesError: string | null = null;
  if (schedHint.ok) {
    const { data: mr, error: mErr } = await supabase
      .from("tournament_matches")
      .select("*")
      .eq("tournament_id", id)
      .order("sort_index", { ascending: true });
    if (mErr) matchesError = mErr.message;
    else matchRows = (mr ?? []) as TournamentMatchRow[];
  }

  let globalOff = 0;
  const vorrundeSegments = segments.map((seg) => {
    const slots = Array.from({ length: seg.size }, (_, i) => globalOff + i);
    globalOff += seg.size;
    return {
      label: seg.label,
      groupCode: segmentLabelToGroupCode(seg.label),
      slots,
    };
  });

  const btnOutline =
    "inline-flex items-center justify-center rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-sm font-medium text-app-ink shadow-sm transition hover:border-app-primary/40";
  const btnPrimary =
    "inline-flex items-center justify-center rounded-xl bg-app-primary px-4 py-2.5 text-sm font-medium text-app-card shadow-md shadow-app-primary/20 transition hover:bg-app-primary-hover";

  return (
    <div className="w-full px-6 py-10 lg:px-10">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/turniere" className={btnOutline} prefetch>
          ← Alle Turniere
        </Link>
        <Link href={`/turniere/${id}/bearbeiten`} className={btnPrimary} prefetch>
          Bearbeiten
        </Link>
        {tn >= 2 &&
        !names.every((x) => !String(x).trim()) &&
        schedHint.ok &&
        !matchesError ? (
          <ResetTournamentResultsButton tournamentId={id} />
        ) : null}
      </div>
      <h1 className="mt-8 text-2xl font-semibold text-app-ink">{t.title}</h1>

      <div className="mt-8">
        {!schedHint.ok ? (
          <div className="rounded-xl border border-app-accent/40 bg-app-accent-soft/40 p-4 text-sm text-app-ink">
            <p className="font-medium">Spielplan konnte nicht erstellt werden</p>
            <p className="mt-2 text-app-muted">{schedHint.error}</p>
          </div>
        ) : matchesError ? (
          <div className="rounded-xl border border-app-accent/40 bg-app-accent-soft/40 p-4 text-sm text-app-ink">
            <p className="font-medium">Hinweis zur Datenbank</p>
            <p className="mt-2 text-app-muted">
              Bitte Migration ausführen:{" "}
              <code className="rounded bg-app-card px-1.5 py-0.5">
                supabase-migration-tournament-matches.sql
              </code>
              . Fehler: {matchesError}
            </p>
          </div>
        ) : tn < 2 || names.every((x) => !String(x).trim()) ? (
          <p className="text-sm text-app-muted">
            Mindestens zwei Teilnehmer mit Namen eintragen, um den Spielplan zu
            sehen.
          </p>
        ) : (
          <VorrundePlan
            tournamentId={id}
            firstMatchNumber={t.first_match_number ?? 1}
            participantNames={names}
            segments={vorrundeSegments}
            initialMatches={matchRows}
            rankingRule={rankId}
            pointsPreset={ptsId}
            countingMode={cm}
            h2hIncludesGdGf={Boolean(t.h2h_includes_gd_gf)}
          />
        )}
      </div>

      <div className="mt-10 border-t border-app-border/70 pt-8">
        <DeleteTournamentForm tournamentId={id} />
      </div>
    </div>
  );
}
