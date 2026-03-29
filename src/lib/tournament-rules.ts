/** Voreinstellungen für Gruppenphase: Platzierungsregeln & Punkte (UI + DB-Keys). */

export type GroupRankingRuleId =
  | "gr_1"
  | "gr_2"
  | "gr_3"
  | "gr_4"
  | "gr_5"
  | "gr_6"
  | "gr_7"
  | "gr_8";

export type GroupPointsPresetId =
  | "pts_1_0_0"
  | "pts_1_0p5_0"
  | "pts_2_1_0"
  | "pts_3_1_0"
  | "pts_5_3_0";

export type PointsPresetValues = { win: number; draw: number; loss: number };

export const GROUP_RANKING_RULE_OPTIONS: ReadonlyArray<{
  id: GroupRankingRuleId;
  label: string;
}> = [
  {
    id: "gr_1",
    label:
      "Punkte - Direkter Vergleich - Tordifferenz - Anzahl Tore",
  },
  {
    id: "gr_2",
    label:
      "Punkte - Tordifferenz - Anzahl Tore - Direkter Vergleich",
  },
  {
    id: "gr_3",
    label: "Punkte - Tordifferenz - Anzahl Tore",
  },
  {
    id: "gr_4",
    label:
      "Punkte - Tordifferenz - Direkter Vergleich - Anzahl Tore",
  },
  {
    id: "gr_5",
    label:
      "Punkte - Anzahl Tore - Tordifferenz - Direkter Vergleich",
  },
  {
    id: "gr_6",
    label: "Punkte - Anzahl Tore - Tordifferenz",
  },
  {
    id: "gr_7",
    label:
      "Punkte - Direkter Vergleich - Anzahl Tore - Tordifferenz",
  },
  { id: "gr_8", label: "Punkte - Direkter Vergleich" },
];

export const GROUP_POINTS_PRESET_OPTIONS: ReadonlyArray<{
  id: GroupPointsPresetId;
  label: string;
}> = [
  {
    id: "pts_1_0_0",
    label:
      "1 Punkt für Siege, 0 Punkte für Unentschieden, 0 Punkte für Niederlagen",
  },
  {
    id: "pts_1_0p5_0",
    label:
      "1 Punkt für Siege, 0,5 Punkte für Unentschieden, 0 Punkte für Niederlagen",
  },
  {
    id: "pts_2_1_0",
    label:
      "2 Punkte für Siege, 1 Punkt für Unentschieden, 0 Punkte für Niederlagen",
  },
  {
    id: "pts_3_1_0",
    label:
      "3 Punkte für Siege, 1 Punkt für Unentschieden, 0 Punkte für Niederlagen",
  },
  {
    id: "pts_5_3_0",
    label:
      "5 Punkte für Siege, 3 Punkte für Unentschieden, 0 Punkte für Niederlagen",
  },
];

export const DEFAULT_GROUP_RANKING_RULE: GroupRankingRuleId = "gr_1";
export const DEFAULT_GROUP_POINTS_PRESET: GroupPointsPresetId = "pts_3_1_0";

export function isGroupRankingRuleId(v: string): v is GroupRankingRuleId {
  return GROUP_RANKING_RULE_OPTIONS.some((o) => o.id === v);
}

export function isGroupPointsPresetId(v: string): v is GroupPointsPresetId {
  return GROUP_POINTS_PRESET_OPTIONS.some((o) => o.id === v);
}

export function normalizeGroupRankingRule(
  v: string | null | undefined,
): GroupRankingRuleId {
  if (v && isGroupRankingRuleId(v)) return v;
  return DEFAULT_GROUP_RANKING_RULE;
}

export function normalizeGroupPointsPreset(
  v: string | null | undefined,
): GroupPointsPresetId {
  if (v && isGroupPointsPresetId(v)) return v;
  return DEFAULT_GROUP_POINTS_PRESET;
}

export function groupRankingRuleLabel(id: GroupRankingRuleId): string {
  return (
    GROUP_RANKING_RULE_OPTIONS.find((o) => o.id === id)?.label ??
    GROUP_RANKING_RULE_OPTIONS[0].label
  );
}

export function groupPointsPresetLabel(id: GroupPointsPresetId): string {
  return (
    GROUP_POINTS_PRESET_OPTIONS.find((o) => o.id === id)?.label ??
    GROUP_POINTS_PRESET_OPTIONS[3].label
  );
}

export function pointsFromPreset(id: GroupPointsPresetId): PointsPresetValues {
  switch (id) {
    case "pts_1_0_0":
      return { win: 1, draw: 0, loss: 0 };
    case "pts_1_0p5_0":
      return { win: 1, draw: 0.5, loss: 0 };
    case "pts_2_1_0":
      return { win: 2, draw: 1, loss: 0 };
    case "pts_3_1_0":
      return { win: 3, draw: 1, loss: 0 };
    case "pts_5_3_0":
      return { win: 5, draw: 3, loss: 0 };
    default:
      return { win: 3, draw: 1, loss: 0 };
  }
}
