import type { BuiltMatchRowUnified } from "@/lib/match-plan-types";

/** Finale / KO-Runden nach der Vorrunde (Platzhalter nach Gruppentabellen). */

function hasThirdPlace(modusKey: string): boolean {
  return (
    modusKey.includes("p3") ||
    modusKey.includes("P3") ||
    modusKey.includes("platz_3")
  );
}

function pushKo(
  out: BuiltMatchRowUnified[],
  sortIndexRef: { v: number },
  courts: number,
  roundCode: string,
  labelHome: string,
  labelAway: string,
) {
  const i = sortIndexRef.v;
  out.push({
    sort_index: i,
    match_phase: "ko",
    group_code: roundCode,
    pitch: (i % courts) + 1,
    start_time: null,
    slot_home: null,
    slot_away: null,
    label_home: labelHome,
    label_away: labelAway,
  });
  sortIndexRef.v += 1;
}

function twoGroupSizes(teamCount: number): [number, number] {
  const n = Math.max(0, teamCount);
  return [Math.ceil(n / 2), Math.floor(n / 2)];
}

/** Je ein Kreuzspiel pro Tabellenplatz (letztes Spiel = Finale 1A vs 1B). */
function buildG2CrossAll(
  courts: number,
  start: { v: number },
  sizeA: number,
  sizeB: number,
): BuiltMatchRowUnified[] {
  const out: BuiltMatchRowUnified[] = [];
  const lo = Math.min(sizeA, sizeB);
  for (let k = lo; k >= 1; k--) {
    const code = k === 1 ? "F" : "XP";
    pushKo(
      out,
      start,
      courts,
      code,
      `${k}. Platz Gruppe A`,
      `${k}. Platz Gruppe B`,
    );
  }
  return out;
}

/** Kreuzspiele ab Platz 3, danach klassisches Halbfinale der ersten Vier. */
function buildG2SemiAllFinal(
  modusKey: string,
  courts: number,
  start: { v: number },
  sizeA: number,
  sizeB: number,
): BuiltMatchRowUnified[] {
  const out: BuiltMatchRowUnified[] = [];
  const lo = Math.min(sizeA, sizeB);
  for (let k = lo; k >= 3; k--) {
    pushKo(
      out,
      start,
      courts,
      "XP",
      `${k}. Platz Gruppe A`,
      `${k}. Platz Gruppe B`,
    );
  }
  out.push(...buildG2Standard(modusKey, courts, start));
  return out;
}

/** Spiel um Plätze 5–6 (3A vs 3B), dann Halbfinale / Finale wie Standard. */
function buildG2Places16(
  modusKey: string,
  courts: number,
  start: { v: number },
): BuiltMatchRowUnified[] {
  const out: BuiltMatchRowUnified[] = [];
  pushKo(
    out,
    start,
    courts,
    "P56",
    "3. Platz Gruppe A",
    "3. Platz Gruppe B",
  );
  out.push(...buildG2Standard(modusKey, courts, start));
  return out;
}

/** Optionales „kleines Halbfinale“ 3v4 je Gruppe, dann großes HF / Finale. */
function buildG2SmallSemiAll(
  modusKey: string,
  courts: number,
  start: { v: number },
  sizeA: number,
  sizeB: number,
): BuiltMatchRowUnified[] {
  const out: BuiltMatchRowUnified[] = [];
  if (sizeA >= 4 && sizeB >= 4) {
    pushKo(
      out,
      start,
      courts,
      "KHF",
      "3. Platz Gruppe A",
      "4. Platz Gruppe A",
    );
    pushKo(
      out,
      start,
      courts,
      "KHF",
      "3. Platz Gruppe B",
      "4. Platz Gruppe B",
    );
  }
  out.push(...buildG2Standard(modusKey, courts, start));
  return out;
}

/** 2 Gruppen A/B: Kreuz-Halbfinale, optional P3, Finale. */
function buildG2Standard(
  modusKey: string,
  courts: number,
  start: { v: number },
): BuiltMatchRowUnified[] {
  const out: BuiltMatchRowUnified[] = [];
  const third = hasThirdPlace(modusKey);
  pushKo(out, start, courts, "HF", "1. Platz Gruppe A", "2. Platz Gruppe B");
  pushKo(out, start, courts, "HF", "1. Platz Gruppe B", "2. Platz Gruppe A");
  if (third) {
    pushKo(
      out,
      start,
      courts,
      "P3",
      "Verlierer Halbfinale 1",
      "Verlierer Halbfinale 2",
    );
  }
  pushKo(out, start, courts, "F", "Sieger Halbfinale 1", "Sieger Halbfinale 2");
  return out;
}

/** 2 Gruppen: klassische VF-Paarung (1A–2B, …). */
function buildG2Quarter(
  modusKey: string,
  courts: number,
  start: { v: number },
): BuiltMatchRowUnified[] {
  const out: BuiltMatchRowUnified[] = [];
  const third = hasThirdPlace(modusKey);
  pushKo(out, start, courts, "VF", "1. Platz Gruppe A", "2. Platz Gruppe B");
  pushKo(out, start, courts, "VF", "2. Platz Gruppe A", "1. Platz Gruppe B");
  pushKo(out, start, courts, "VF", "3. Platz Gruppe A", "4. Platz Gruppe B");
  pushKo(out, start, courts, "VF", "4. Platz Gruppe A", "3. Platz Gruppe B");
  pushKo(out, start, courts, "HF", "Sieger VF 1", "Sieger VF 2");
  pushKo(out, start, courts, "HF", "Sieger VF 3", "Sieger VF 4");
  if (third) {
    pushKo(
      out,
      start,
      courts,
      "P3",
      "Verlierer Halbfinale 1",
      "Verlierer Halbfinale 2",
    );
  }
  pushKo(out, start, courts, "F", "Sieger Halbfinale 1", "Sieger Halbfinale 2");
  return out;
}

/** Viertelfinale mit Kreuz-Paarung (1A–4B, 2A–3B, …). */
function buildG2QuarterCross(
  modusKey: string,
  courts: number,
  start: { v: number },
): BuiltMatchRowUnified[] {
  const out: BuiltMatchRowUnified[] = [];
  const third = hasThirdPlace(modusKey);
  pushKo(out, start, courts, "VF", "1. Platz Gruppe A", "4. Platz Gruppe B");
  pushKo(out, start, courts, "VF", "2. Platz Gruppe A", "3. Platz Gruppe B");
  pushKo(out, start, courts, "VF", "3. Platz Gruppe A", "2. Platz Gruppe B");
  pushKo(out, start, courts, "VF", "4. Platz Gruppe A", "1. Platz Gruppe B");
  pushKo(out, start, courts, "HF", "Sieger VF 1", "Sieger VF 2");
  pushKo(out, start, courts, "HF", "Sieger VF 3", "Sieger VF 4");
  if (third) {
    pushKo(
      out,
      start,
      courts,
      "P3",
      "Verlierer Halbfinale 1",
      "Verlierer Halbfinale 2",
    );
  }
  pushKo(out, start, courts, "F", "Sieger Halbfinale 1", "Sieger Halbfinale 2");
  return out;
}

/** 4 Gruppen: Halbfinale der Gruppenersten, optional P3, Finale. */
function buildG4(
  modusKey: string,
  courts: number,
  start: { v: number },
): BuiltMatchRowUnified[] {
  const out: BuiltMatchRowUnified[] = [];
  const third = hasThirdPlace(modusKey);
  pushKo(out, start, courts, "HF", "1. Platz Gruppe A", "1. Platz Gruppe B");
  pushKo(out, start, courts, "HF", "1. Platz Gruppe C", "1. Platz Gruppe D");
  if (third) {
    pushKo(
      out,
      start,
      courts,
      "P3",
      "Verlierer Halbfinale 1",
      "Verlierer Halbfinale 2",
    );
  }
  pushKo(out, start, courts, "F", "Sieger Halbfinale 1", "Sieger Halbfinale 2");
  return out;
}

/** 1 Gruppe: z. B. Platz 1–4 mit Halbfinale. */
function buildG1SemiFlow(
  modusKey: string,
  courts: number,
  start: { v: number },
): BuiltMatchRowUnified[] {
  const out: BuiltMatchRowUnified[] = [];
  const third = hasThirdPlace(modusKey);
  pushKo(out, start, courts, "HF", "1. Platz Vorrunde", "4. Platz Vorrunde");
  pushKo(out, start, courts, "HF", "2. Platz Vorrunde", "3. Platz Vorrunde");
  if (third) {
    pushKo(
      out,
      start,
      courts,
      "P3",
      "Verlierer Halbfinale 1",
      "Verlierer Halbfinale 2",
    );
  }
  pushKo(out, start, courts, "F", "Sieger Halbfinale 1", "Sieger Halbfinale 2");
  return out;
}

function buildG1QuarterFlow(
  modusKey: string,
  courts: number,
  start: { v: number },
): BuiltMatchRowUnified[] {
  const out: BuiltMatchRowUnified[] = [];
  const third = hasThirdPlace(modusKey);
  pushKo(out, start, courts, "VF", "1. Platz Vorrunde", "8. Platz Vorrunde");
  pushKo(out, start, courts, "VF", "2. Platz Vorrunde", "7. Platz Vorrunde");
  pushKo(out, start, courts, "VF", "3. Platz Vorrunde", "6. Platz Vorrunde");
  pushKo(out, start, courts, "VF", "4. Platz Vorrunde", "5. Platz Vorrunde");
  pushKo(out, start, courts, "HF", "Sieger VF 1", "Sieger VF 2");
  pushKo(out, start, courts, "HF", "Sieger VF 3", "Sieger VF 4");
  if (third) {
    pushKo(
      out,
      start,
      courts,
      "P3",
      "Verlierer Halbfinale 1",
      "Verlierer Halbfinale 2",
    );
  }
  pushKo(out, start, courts, "F", "Sieger Halbfinale 1", "Sieger Halbfinale 2");
  return out;
}

function buildG1FinalOnly(courts: number, start: { v: number }): BuiltMatchRowUnified[] {
  const out: BuiltMatchRowUnified[] = [];
  pushKo(out, start, courts, "F", "1. Platz Vorrunde", "2. Platz Vorrunde");
  return out;
}

function routeG2Ko(
  modusKey: string,
  teamCount: number,
  courtCount: number,
  start: { v: number },
): BuiltMatchRowUnified[] {
  const mk = modusKey;
  const courts = courtCount;
  const [sizeA, sizeB] = twoGroupSizes(teamCount);
  const minG = Math.min(sizeA, sizeB);

  if (mk.startsWith("g2_qf")) {
    if (teamCount < 8) return [];
    if (mk.includes("all_cross")) {
      return buildG2QuarterCross(mk, courts, start);
    }
    return buildG2Quarter(mk, courts, start);
  }

  if (mk === "g2_all_final" || mk === "g2_all_cross_final") {
    return buildG2CrossAll(courts, start, sizeA, sizeB);
  }

  if (mk === "g2_semi_places_1_6_final" && teamCount >= 6 && minG >= 3) {
    return buildG2Places16(mk, courts, start);
  }

  if (mk === "g2_semi_places_1_8_final" && teamCount >= 8) {
    return buildG2Quarter(mk, courts, start);
  }

  if (mk === "g2_semi_all_final") {
    return buildG2SemiAllFinal(mk, courts, start, sizeA, sizeB);
  }

  if (mk === "g2_semi_small_semi_all_final" && teamCount >= 6) {
    return buildG2SmallSemiAll(mk, courts, start, sizeA, sizeB);
  }

  return buildG2Standard(mk, courts, start);
}

export function buildKoMatchPlan(
  modusKey: string,
  teamCount: number,
  courtCount: number,
  startSortIndex: number,
): BuiltMatchRowUnified[] {
  const mk = modusKey || "rr_1";
  if (mk.startsWith("rr_")) return [];

  const courts = Math.max(1, Math.min(99, courtCount));
  const start = { v: startSortIndex };

  if (mk.startsWith("g2_")) {
    return routeG2Ko(mk, teamCount, courts, start);
  }

  if (mk.startsWith("g4_")) {
    return buildG4(mk, courts, start);
  }

  if (mk.startsWith("g1_qf") && teamCount >= 8) {
    return buildG1QuarterFlow(mk, courts, start);
  }

  if (
    mk.startsWith("g1_semi") ||
    (mk.startsWith("g1_all") && teamCount >= 4)
  ) {
    return buildG1SemiFlow(mk, courts, start);
  }

  if (mk.startsWith("g1_")) {
    return buildG1FinalOnly(courts, start);
  }

  return [];
}
