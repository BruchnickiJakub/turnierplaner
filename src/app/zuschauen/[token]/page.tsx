import { createClient } from "@/lib/supabase/server";
import { segmentLabelToGroupCode } from "@/lib/build-vorrunde-schedule";
import {
  getGroupLayout,
  parseParticipantNames,
  type CountingMode,
} from "@/lib/tournament-modes";
import {
  normalizeGroupPointsPreset,
  normalizeGroupRankingRule,
} from "@/lib/tournament-rules";
import { tournamentMatchesFromJsonArray } from "@/lib/tournament-match-json";
import type { TournamentRow } from "@/types/tournament";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VorrundePlan } from "@/components/vorrunde-plan";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ token: string }> };

function snapshotTournamentToRow(
  raw: Record<string, unknown>,
): TournamentRow | null {
  if (typeof raw.id !== "string") return null;
  return {
    id: raw.id,
    user_id: "",
    title: String(raw.title ?? "Turnier"),
    sport: null,
    description: null,
    format: null,
    team_count:
      raw.team_count == null ? null : Number(raw.team_count),
    modus_key:
      raw.modus_key == null ? null : String(raw.modus_key),
    best_placement: null,
    first_match_number:
      raw.first_match_number == null
        ? null
        : Number(raw.first_match_number),
    counting_mode:
      raw.counting_mode === "wins_only" ? "wins_only" : "goals",
    court_count:
      raw.court_count == null ? null : Number(raw.court_count),
    group_ranking_rule:
      raw.group_ranking_rule == null
        ? null
        : String(raw.group_ranking_rule),
    h2h_includes_gd_gf: Boolean(raw.h2h_includes_gd_gf),
    group_points_preset:
      raw.group_points_preset == null
        ? null
        : String(raw.group_points_preset),
    participant_names: raw.participant_names ?? [],
    tournament_start_at:
      raw.tournament_start_at == null
        ? null
        : String(raw.tournament_start_at),
    group_match_duration_minutes:
      raw.group_match_duration_minutes == null
        ? null
        : Number(raw.group_match_duration_minutes),
    ko_match_duration_minutes:
      raw.ko_match_duration_minutes == null
        ? null
        : Number(raw.ko_match_duration_minutes),
    spectator_token: null,
    created_at: "",
    updated_at: "",
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  if (!UUID_RE.test(token)) {
    return { title: "Zuschauen" };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("spectator_get_data", {
    p_token: token,
  });
  if (error || data == null || typeof data !== "object") {
    return { title: "Zuschauen" };
  }
  const snap = data as { tournament?: Record<string, unknown> };
  const title =
    snap.tournament && typeof snap.tournament.title === "string"
      ? snap.tournament.title
      : null;
  return { title: title ? `${title} · Zuschauen` : "Zuschauen" };
}

export default async function ZuschauenPage({ params }: Props) {
  const { token } = await params;
  if (!UUID_RE.test(token)) {
    notFound();
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("spectator_get_data", {
    p_token: token,
  });

  if (error || data == null || typeof data !== "object") {
    notFound();
  }

  const snap = data as {
    tournament?: Record<string, unknown>;
    matches?: unknown;
  };

  const tRaw = snap.tournament;
  if (!tRaw || typeof tRaw !== "object") {
    notFound();
  }

  const t = snapshotTournamentToRow(tRaw);
  if (!t) {
    notFound();
  }

  const matchRows = tournamentMatchesFromJsonArray(snap.matches);
  const tn = t.team_count ?? 0;
  const names = parseParticipantNames(t.participant_names, tn);
  const segments = getGroupLayout(t.modus_key || "rr_1", tn);
  const rankId = normalizeGroupRankingRule(t.group_ranking_rule);
  const ptsId = normalizeGroupPointsPreset(t.group_points_preset);
  const cm = (t.counting_mode === "wins_only" ? "wins_only" : "goals") as CountingMode;

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

  const scheduleParts: string[] = [];
  const startIso = t.tournament_start_at;
  if (startIso) {
    const d = new Date(startIso);
    if (!Number.isNaN(d.getTime())) {
      scheduleParts.push(
        `Beginn: ${new Intl.DateTimeFormat("de-DE", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(d)}`,
      );
    }
  }
  if (t.group_match_duration_minutes != null) {
    scheduleParts.push(`Vorrunde: ${t.group_match_duration_minutes} Min. / Spiel`);
  }
  if (t.ko_match_duration_minutes != null) {
    scheduleParts.push(`K.O.: ${t.ko_match_duration_minutes} Min. / Spiel`);
  }
  const scheduleLine = scheduleParts.length ? scheduleParts.join(" · ") : null;

  return (
    <div className="w-full px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10 lg:px-10">
      <p className="text-sm text-app-muted">
        Ergebnisse werden automatisch aktualisiert. Es können keine Einträge
        geändert werden.
      </p>
      <h1 className="mt-4 text-2xl font-semibold text-app-ink">{t.title}</h1>
      {scheduleLine ? (
        <p className="mt-2 text-sm text-app-muted">{scheduleLine}</p>
      ) : null}

      <div className="mt-8">
        {tn < 2 || names.every((x) => !String(x).trim()) ? (
          <p className="text-sm text-app-muted">
            Für dieses Turnier ist noch kein Spielplan sichtbar.
          </p>
        ) : (
          <VorrundePlan
            tournamentId={t.id}
            firstMatchNumber={t.first_match_number ?? 1}
            participantNames={names}
            segments={vorrundeSegments}
            initialMatches={matchRows}
            rankingRule={rankId}
            pointsPreset={ptsId}
            countingMode={cm}
            h2hIncludesGdGf={Boolean(t.h2h_includes_gd_gf)}
            readOnly
            spectatorPollHref={`/api/zuschauen/${token}`}
          />
        )}
      </div>
    </div>
  );
}
