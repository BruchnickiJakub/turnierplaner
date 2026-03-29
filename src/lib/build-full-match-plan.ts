import { buildKoMatchPlan } from "@/lib/build-ko-schedule";
import { buildVorrundeMatchPlan } from "@/lib/build-vorrunde-schedule";
import type { BuiltMatchRowUnified } from "@/lib/match-plan-types";

export type { BuiltMatchRowUnified };

export function buildFullMatchPlan(
  modusKey: string,
  teamCount: number,
  courtCount: number,
): BuiltMatchRowUnified[] {
  const vorrunde = buildVorrundeMatchPlan(modusKey, teamCount, courtCount);
  const groupRows: BuiltMatchRowUnified[] = vorrunde.map((r) => ({
    sort_index: r.sort_index,
    match_phase: "group",
    group_code: r.group_code,
    pitch: r.pitch,
    start_time: r.start_time,
    slot_home: r.slot_home,
    slot_away: r.slot_away,
    label_home: null,
    label_away: null,
  }));

  const nextIndex =
    groupRows.length > 0 ? groupRows[groupRows.length - 1]!.sort_index + 1 : 0;
  const koRows = buildKoMatchPlan(modusKey, teamCount, courtCount, nextIndex);

  return [...groupRows, ...koRows];
}
