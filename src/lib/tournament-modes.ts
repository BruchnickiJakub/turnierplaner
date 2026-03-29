/** Turnier-Modi angelehnt an gängige Planer; Verfügbarkeit hängt von der Teilnehmerzahl ab. */

export type ModusCategory = "rr" | "groups_ko";

export type ModusDef = {
  id: string;
  label: string;
  category: ModusCategory;
  /** true, wenn der Modus bei dieser Teilnehmerzahl sinnvoll/spielbar ist */
  isAvailable: (n: number) => boolean;
};

const ge = (n: number, min: number) => n >= min;
/** Zwei Gruppen; Größen können um 1 differieren (z. B. 5 → 3+2). */
const twoGroups = (n: number) => ge(n, 4);
/** Vier Gruppen; Restteilnehmer werden auf die ersten Gruppen verteilt. */
const fourGroups = (n: number) => ge(n, 8);

export const TURNIER_MODI: ModusDef[] = [
  {
    id: "rr_1",
    label: "1 Gruppe",
    category: "rr",
    isAvailable: (n) => ge(n, 2),
  },
  {
    id: "rr_1_liga_mt",
    label: "1 Gruppe - Liga - Mehrere Spieltage",
    category: "rr",
    isAvailable: (n) => ge(n, 2),
  },
  {
    id: "g1_all_final",
    label: "1 Gruppe - Alle Plätze - Finale",
    category: "groups_ko",
    isAvailable: (n) => ge(n, 2),
  },
  {
    id: "g1_semi_all",
    label: "1 Gruppe - Halbfinale - Alle Plätze",
    category: "groups_ko",
    isAvailable: (n) => ge(n, 4),
  },
  {
    id: "g1_qf_places_1_4",
    label: "1 Gruppe - Viertelfinale - Spiele um Plätze 1 bis 4",
    category: "groups_ko",
    isAvailable: (n) => ge(n, 8),
  },
  {
    id: "g2_p3_final",
    label: "2 Gruppen - Spiel um Platz 3 - Finale",
    category: "groups_ko",
    isAvailable: twoGroups,
  },
  {
    id: "g2_all_final",
    label: "2 Gruppen - Alle Plätze - Finale",
    category: "groups_ko",
    isAvailable: twoGroups,
  },
  {
    id: "g2_semi_places_1_4_final",
    label: "2 Gruppen - Halbfinale - Spiele um Plätze 1 bis 4 - Finale",
    category: "groups_ko",
    isAvailable: twoGroups,
  },
  {
    id: "g2_semi_places_1_6_final",
    label: "2 Gruppen - Halbfinale - Spiele um Plätze 1 bis 6 - Finale",
    category: "groups_ko",
    isAvailable: (n) => twoGroups(n) && ge(n, 6),
  },
  {
    id: "g2_semi_places_1_8_final",
    label: "2 Gruppen - Halbfinale - Spiele um Plätze 1 bis 8 - Finale",
    category: "groups_ko",
    isAvailable: (n) => twoGroups(n) && ge(n, 8),
  },
  {
    id: "g2_semi_all_final",
    label: "2 Gruppen - Halbfinale - Alle Plätze - Finale",
    category: "groups_ko",
    isAvailable: twoGroups,
  },
  {
    id: "g2_semi_small_semi_all_final",
    label: "2 Gruppen - Kleines Halbfinale - Halbfinale - Alle Plätze - Finale",
    category: "groups_ko",
    isAvailable: (n) => twoGroups(n) && ge(n, 6),
  },
  {
    id: "g2_all_cross_final",
    label: "2 Gruppen - Alle Plätze über Kreuzspiele - Finale",
    category: "groups_ko",
    isAvailable: twoGroups,
  },
  {
    id: "g2_qf_p3_final",
    label: "2 Gruppen - Viertelfinale - Spiel um Platz 3 - Finale",
    category: "groups_ko",
    isAvailable: (n) => twoGroups(n) && ge(n, 8),
  },
  {
    id: "g2_qf_all_final",
    label: "2 Gruppen - Viertelfinale - Alle Plätze - Finale",
    category: "groups_ko",
    isAvailable: (n) => twoGroups(n) && ge(n, 8),
  },
  {
    id: "g2_qf_all_cross_final",
    label: "2 Gruppen - Viertelfinale - Alle Plätze über Kreuzspiele - Finale",
    category: "groups_ko",
    isAvailable: (n) => twoGroups(n) && ge(n, 8),
  },
  {
    id: "g4_semi_p3_final",
    label: "4 Gruppen - Halbfinale - Spiel um Platz 3 - Finale",
    category: "groups_ko",
    isAvailable: fourGroups,
  },
  {
    id: "g4_semi_all_final",
    label: "4 Gruppen - Halbfinale - Alle Plätze - Finale",
    category: "groups_ko",
    isAvailable: fourGroups,
  },
];

const CATEGORY_LABEL: Record<ModusCategory, string> = {
  rr: "Jeder gegen jeden (Round Robin)",
  groups_ko: "Gruppen & KO-Runden",
};

export function getAvailableModi(participantCount: number): ModusDef[] {
  if (!Number.isFinite(participantCount) || participantCount < 2) return [];
  return TURNIER_MODI.filter((m) => m.isAvailable(participantCount));
}

export function isModusValid(modusId: string, participantCount: number): boolean {
  const m = TURNIER_MODI.find((x) => x.id === modusId);
  return m != null && m.isAvailable(participantCount);
}

export function getModusLabel(modusId: string | null): string {
  if (!modusId) return "—";
  return TURNIER_MODI.find((m) => m.id === modusId)?.label ?? modusId;
}

export function groupModiByCategory(
  modi: ModusDef[],
): { category: ModusCategory; title: string; items: ModusDef[] }[] {
  const rr = modi.filter((m) => m.category === "rr");
  const gk = modi.filter((m) => m.category === "groups_ko");
  const out: { category: ModusCategory; title: string; items: ModusDef[] }[] =
    [];
  if (rr.length) out.push({ category: "rr", title: CATEGORY_LABEL.rr, items: rr });
  if (gk.length)
    out.push({ category: "groups_ko", title: CATEGORY_LABEL.groups_ko, items: gk });
  return out;
}

export type CountingMode = "goals" | "wins_only";

export const COUNTING_MODE_LABEL: Record<CountingMode, string> = {
  goals: "Tore",
  wins_only: "Nur Siege",
};

/** Tabellen-Segmente für Phase „Teilnehmer“ (eine Tabelle oder Gruppe A/B/…). */
export type GroupSegment = { label: string; size: number };

const GROUP_LETTERS = ["A", "B", "C", "D"] as const;

export function getGroupLayout(modusKey: string, n: number): GroupSegment[] {
  if (!Number.isFinite(n) || n < 1) return [];
  if (modusKey.startsWith("g4_")) {
    const base = Math.floor(n / 4);
    const rem = n % 4;
    return GROUP_LETTERS.slice(0, 4).map((L, i) => ({
      label: `Gruppe ${L}`,
      size: base + (i < rem ? 1 : 0),
    }));
  }
  if (modusKey.startsWith("g2_")) {
    const sizeA = Math.ceil(n / 2);
    const sizeB = n - sizeA;
    return [
      { label: "Gruppe A", size: sizeA },
      { label: "Gruppe B", size: sizeB },
    ];
  }
  return [{ label: "Teilnehmer", size: n }];
}

export function parseParticipantNames(raw: unknown, n: number): string[] {
  const out: string[] = [];
  if (Array.isArray(raw)) {
    for (let i = 0; i < n; i++) {
      out.push(String(raw[i] ?? "").trim());
    }
  } else {
    for (let i = 0; i < n; i++) out.push("");
  }
  while (out.length < n) out.push("");
  return out.slice(0, n);
}
