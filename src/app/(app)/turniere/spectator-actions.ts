"use server";

import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

export type SpectatorTokenResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

export async function ensureSpectatorToken(
  tournamentId: string,
): Promise<SpectatorTokenResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Nicht angemeldet." };
  }

  const { data: t, error: se } = await supabase
    .from("tournaments")
    .select("id, user_id, spectator_token")
    .eq("id", tournamentId)
    .maybeSingle();

  if (se || !t || t.user_id !== user.id) {
    return { ok: false, error: "Kein Zugriff." };
  }

  const existing =
    t.spectator_token != null ? String(t.spectator_token).trim() : "";
  if (existing) {
    return { ok: true, token: existing };
  }

  const token = randomUUID();
  const { error: ue } = await supabase
    .from("tournaments")
    .update({
      spectator_token: token,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tournamentId);

  if (ue) {
    return { ok: false, error: ue.message };
  }

  revalidatePath(`/turniere/${tournamentId}`);
  revalidatePath("/turniere");
  return { ok: true, token };
}

/** Macht den bisherigen Zuschauer-Link ungültig und erzeugt einen neuen. */
export async function regenerateSpectatorToken(
  tournamentId: string,
): Promise<SpectatorTokenResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Nicht angemeldet." };
  }

  const { data: t, error: se } = await supabase
    .from("tournaments")
    .select("id, user_id")
    .eq("id", tournamentId)
    .maybeSingle();

  if (se || !t || t.user_id !== user.id) {
    return { ok: false, error: "Kein Zugriff." };
  }

  const token = randomUUID();
  const { error: ue } = await supabase
    .from("tournaments")
    .update({
      spectator_token: token,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tournamentId);

  if (ue) {
    return { ok: false, error: ue.message };
  }

  revalidatePath(`/turniere/${tournamentId}`);
  revalidatePath("/turniere");
  return { ok: true, token };
}
