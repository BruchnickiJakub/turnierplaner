import { TournamentEditNav } from "@/components/tournament-edit-nav";
import { TournamentWizard } from "@/components/tournament-wizard";
import {
  normalizeGroupPointsPreset,
  normalizeGroupRankingRule,
} from "@/lib/tournament-rules";
import { createClient } from "@/lib/supabase/server";
import type { TournamentRow } from "@/types/tournament";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function TurnierBearbeitenPage({ params }: Props) {
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

  const cm =
    t.counting_mode === "wins_only" ? "wins_only" : "goals";
  const tc = t.team_count ?? 8;
  const courts = t.court_count != null && t.court_count >= 1 ? t.court_count : 1;
  const rankRule = normalizeGroupRankingRule(t.group_ranking_rule);
  const ptsPreset = normalizeGroupPointsPreset(t.group_points_preset);

  return (
    <div className="w-full px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10 lg:px-10">
      <TournamentEditNav tournamentId={id} />
      <h1 className="mt-8 text-2xl font-semibold text-app-ink">
        Turnier bearbeiten
      </h1>
      <div className="mt-8 w-full rounded-2xl border border-app-border/90 bg-app-card p-4 shadow-sm sm:p-8">
        <TournamentWizard
          mode="edit"
          initial={{
            id: t.id,
            title: t.title,
            participantCount: tc,
            modusKey: t.modus_key,
            countingMode: cm,
            courtCount: courts,
            groupRankingRule: rankRule,
            h2hIncludesGdGf: Boolean(t.h2h_includes_gd_gf),
            groupPointsPreset: ptsPreset,
            participantNames: t.participant_names,
          }}
        />
      </div>
    </div>
  );
}
