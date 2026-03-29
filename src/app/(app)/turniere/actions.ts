"use server";

import { replaceTournamentMatchPlan } from "@/app/(app)/turniere/plan-actions";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeGroupPointsPreset,
  normalizeGroupRankingRule,
  type GroupPointsPresetId,
  type GroupRankingRuleId,
} from "@/lib/tournament-rules";
import { type CountingMode, isModusValid } from "@/lib/tournament-modes";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type SaveTournamentResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

export type TournamentPayload = {
  title: string;
  participantCount: number;
  modusKey: string;
  bestPlacement: number;
  firstMatchNumber: number;
  countingMode: CountingMode;
  courtCount: number;
  groupRankingRule: GroupRankingRuleId;
  h2hIncludesGdGf: boolean;
  groupPointsPreset: GroupPointsPresetId;
  participantNames: string[];
  id?: string;
};

function normalizeCountingMode(v: string): CountingMode {
  return v === "wins_only" ? "wins_only" : "goals";
}

function finalizeNames(names: string[], n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const t = String(names[i] ?? "").trim();
    return t || `${i + 1}. Teilnehmer`;
  });
}

export async function saveTournament(
  payload: TournamentPayload,
): Promise<SaveTournamentResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Nicht angemeldet." };
  }

  const title = payload.title.trim();
  if (!title) {
    return { ok: false, error: "Turniername fehlt." };
  }

  const n = payload.participantCount;
  if (!Number.isFinite(n) || n < 2) {
    return { ok: false, error: "Mindestens 2 Teilnehmer." };
  }

  if (!isModusValid(payload.modusKey, n)) {
    return { ok: false, error: "Modus passt nicht zur Teilnehmerzahl." };
  }

  if (!Array.isArray(payload.participantNames)) {
    return { ok: false, error: "Teilnehmerliste fehlt." };
  }

  const finalized = finalizeNames(payload.participantNames, n);
  if (finalized.length !== n) {
    return { ok: false, error: "Teilnehmerliste ist ungültig." };
  }

  const bp = Math.max(1, Math.floor(payload.bestPlacement));
  const fm = Math.max(1, Math.floor(payload.firstMatchNumber));
  const countingMode = normalizeCountingMode(payload.countingMode);
  const courts = Math.min(99, Math.max(1, Math.floor(payload.courtCount)));
  const groupRankingRule = normalizeGroupRankingRule(payload.groupRankingRule);
  const groupPointsPreset = normalizeGroupPointsPreset(payload.groupPointsPreset);

  const rowBase = {
    title,
    sport: null as string | null,
    description: null as string | null,
    team_count: n,
    modus_key: payload.modusKey,
    best_placement: Math.min(bp, n),
    first_match_number: fm,
    counting_mode: countingMode,
    court_count: courts,
    group_ranking_rule: groupRankingRule,
    h2h_includes_gd_gf: Boolean(payload.h2hIncludesGdGf),
    group_points_preset: groupPointsPreset,
    format: null as string | null,
    participant_names: finalized,
  };

  if (payload.id) {
    const { data: existing } = await supabase
      .from("tournaments")
      .select("user_id")
      .eq("id", payload.id)
      .maybeSingle();

    if (!existing || existing.user_id !== user.id) {
      return { ok: false, error: "Turnier nicht gefunden." };
    }

    const { error } = await supabase
      .from("tournaments")
      .update({
        ...rowBase,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.id);

    if (error) {
      return { ok: false, error: error.message };
    }

    const planRes = await replaceTournamentMatchPlan(
      payload.id,
      payload.modusKey,
      n,
      courts,
    );
    if (!planRes.ok) {
      return { ok: false, error: planRes.error };
    }

    revalidatePath("/turniere");
    revalidatePath(`/turniere/${payload.id}`);
    return { ok: true, id: payload.id };
  }

  const { data: created, error } = await supabase
    .from("tournaments")
    .insert({
      user_id: user.id,
      ...rowBase,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/turniere");
  return { ok: true, id: created?.id };
}

export async function deleteTournament(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/anmelden");
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    redirect("/turniere");
  }

  const { data: existing } = await supabase
    .from("tournaments")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.user_id !== user.id) {
    redirect("/turniere");
  }

  await supabase.from("tournaments").delete().eq("id", id);
  revalidatePath("/turniere");
  redirect("/turniere");
}
