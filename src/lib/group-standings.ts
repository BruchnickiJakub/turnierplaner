import type { CountingMode } from "@/lib/tournament-modes";
import type {
  GroupPointsPresetId,
  GroupRankingRuleId,
} from "@/lib/tournament-rules";
import { pointsFromPreset } from "@/lib/tournament-rules";

export type StandingMatch = {
  slot_home: number;
  slot_away: number;
  goals_home: number | null;
  goals_away: number | null;
};

export type GroupStandingRow = {
  rank: number;
  slot: number;
  name: string;
  played: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

type Criterion =
  | "pts"
  | "h2h_pts"
  | "h2h_gd"
  | "h2h_gf"
  | "gd"
  | "gf";

function criteriaOrder(rule: GroupRankingRuleId): Criterion[] {
  switch (rule) {
    case "gr_1":
      return ["pts", "h2h_pts", "h2h_gd", "h2h_gf", "gd", "gf"];
    case "gr_2":
      return ["pts", "gd", "gf", "h2h_pts", "h2h_gd", "h2h_gf"];
    case "gr_3":
      return ["pts", "gd", "gf"];
    case "gr_4":
      return ["pts", "gd", "h2h_pts", "h2h_gd", "h2h_gf", "gf"];
    case "gr_5":
      return ["pts", "gf", "gd", "h2h_pts", "h2h_gd", "h2h_gf"];
    case "gr_6":
      return ["pts", "gf", "gd"];
    case "gr_7":
      return ["pts", "h2h_pts", "h2h_gf", "h2h_gd", "gf", "gd"];
    case "gr_8":
      return ["pts", "h2h_pts", "h2h_gd", "h2h_gf"];
    default:
      return ["pts", "gd", "gf"];
  }
}

function applyCountingMode(
  gh: number,
  ga: number,
  mode: CountingMode,
): [number, number] {
  if (mode !== "wins_only") return [gh, ga];
  if (gh > ga) return [1, 0];
  if (ga > gh) return [0, 1];
  return [0, 0];
}

function finished(m: StandingMatch): boolean {
  return (
    m.goals_home != null &&
    m.goals_away != null &&
    Number.isFinite(m.goals_home) &&
    Number.isFinite(m.goals_away)
  );
}

function miniLeague(
  subset: number[],
  allMatches: StandingMatch[],
  preset: ReturnType<typeof pointsFromPreset>,
  countingMode: CountingMode,
): Map<number, { pts: number; gf: number; ga: number; gd: number }> {
  const set = new Set(subset);
  const map = new Map<
    number,
    { pts: number; gf: number; ga: number; gd: number }
  >();
  for (const s of subset) {
    map.set(s, { pts: 0, gf: 0, ga: 0, gd: 0 });
  }
  for (const m of allMatches) {
    if (!finished(m)) continue;
    if (!set.has(m.slot_home) || !set.has(m.slot_away)) continue;
    let [gh, ga] = [m.goals_home!, m.goals_away!];
    [gh, ga] = applyCountingMode(gh, ga, countingMode);
    const a = map.get(m.slot_home)!;
    const b = map.get(m.slot_away)!;
    a.gf += gh;
    a.ga += ga;
    b.gf += ga;
    b.ga += gh;
    if (gh > ga) {
      a.pts += preset.win;
      b.pts += preset.loss;
    } else if (gh < ga) {
      a.pts += preset.loss;
      b.pts += preset.win;
    } else {
      a.pts += preset.draw;
      b.pts += preset.draw;
    }
  }
  for (const s of subset) {
    const r = map.get(s)!;
    r.gd = r.gf - r.ga;
  }
  return map;
}

function compareSlots(
  sa: number,
  sb: number,
  full: Map<number, { pts: number; gf: number; ga: number; played: number }>,
  matches: StandingMatch[],
  order: Criterion[],
  preset: ReturnType<typeof pointsFromPreset>,
  countingMode: CountingMode,
  h2hExtra: boolean,
): number {
  const fa = full.get(sa)!;
  const fb = full.get(sb)!;
  const tiedPool = [sa, sb];
  const mini = miniLeague(tiedPool, matches, preset, countingMode);
  for (const c of order) {
    let cmp = 0;
    switch (c) {
      case "pts":
        cmp = fa.pts - fb.pts;
        break;
      case "gd":
        cmp = fa.gf - fa.ga - (fb.gf - fb.ga);
        break;
      case "gf":
        cmp = fa.gf - fb.gf;
        break;
      case "h2h_pts": {
        const ma = mini.get(sa)!;
        const mb = mini.get(sb)!;
        cmp = ma.pts - mb.pts;
        break;
      }
      case "h2h_gd": {
        if (!h2hExtra) continue;
        const ma = mini.get(sa)!;
        const mb = mini.get(sb)!;
        cmp = ma.gd - mb.gd;
        break;
      }
      case "h2h_gf": {
        if (!h2hExtra) continue;
        const ma = mini.get(sa)!;
        const mb = mini.get(sb)!;
        cmp = ma.gf - mb.gf;
        break;
      }
      default:
        break;
    }
    if (cmp !== 0) return -Math.sign(cmp);
  }
  return 0;
}

function sortGroupSlots(
  slots: number[],
  matches: StandingMatch[],
  rule: GroupRankingRuleId,
  presetId: GroupPointsPresetId,
  countingMode: CountingMode,
  h2hIncludesGdGf: boolean,
): number[] {
  const preset = pointsFromPreset(presetId);
  const order = criteriaOrder(rule);
  const full = new Map<
    number,
    { pts: number; gf: number; ga: number; played: number }
  >();

  for (const s of slots) {
    full.set(s, { pts: 0, gf: 0, ga: 0, played: 0 });
  }

  const groupSet = new Set(slots);
  for (const m of matches) {
    if (!finished(m)) continue;
    if (!groupSet.has(m.slot_home) || !groupSet.has(m.slot_away)) continue;
    let [gh, ga] = [m.goals_home!, m.goals_away!];
    [gh, ga] = applyCountingMode(gh, ga, countingMode);
    const a = full.get(m.slot_home)!;
    const b = full.get(m.slot_away)!;
    a.played++;
    b.played++;
    a.gf += gh;
    a.ga += ga;
    b.gf += ga;
    b.ga += gh;
    if (gh > ga) {
      a.pts += preset.win;
      b.pts += preset.loss;
    } else if (gh < ga) {
      a.pts += preset.loss;
      b.pts += preset.win;
    } else {
      a.pts += preset.draw;
      b.pts += preset.draw;
    }
  }

  const sorted = [...slots].sort((sa, sb) => {
    return compareSlots(
      sa,
      sb,
      full,
      matches,
      order,
      preset,
      countingMode,
      h2hIncludesGdGf,
    );
  });

  /** Mehrwege-Ties: erneut mit allen noch gleich platzierten Slots Mini-Liga */
  const reordered = multiWayTieBreak(
    sorted,
    full,
    matches,
    order,
    preset,
    countingMode,
    h2hIncludesGdGf,
  );

  return reordered;
}

function multiWayTieBreak(
  sorted: number[],
  full: Map<number, { pts: number; gf: number; ga: number; played: number }>,
  matches: StandingMatch[],
  order: Criterion[],
  preset: ReturnType<typeof pointsFromPreset>,
  countingMode: CountingMode,
  h2hExtra: boolean,
): number[] {
  const out: number[] = [];
  let i = 0;
  while (i < sorted.length) {
    const slice: number[] = [];
    const base = full.get(sorted[i]!)!;
    let j = i;
    while (
      j < sorted.length &&
      compareSlots(
        sorted[i]!,
        sorted[j]!,
        full,
        matches,
        order,
        preset,
        countingMode,
        h2hExtra,
      ) === 0
    ) {
      slice.push(sorted[j]!);
      j++;
    }
    if (slice.length <= 2) {
      slice.sort((sa, sb) =>
        compareSlots(
          sa,
          sb,
          full,
          matches,
          order,
          preset,
          countingMode,
          h2hExtra,
        ),
      );
      out.push(...slice);
    } else {
      const mini = miniLeague(slice, matches, preset, countingMode);
      const inner = [...slice].sort((sa, sb) => {
        const ma = mini.get(sa)!;
        const mb = mini.get(sb)!;
        if (ma.pts !== mb.pts) return -Math.sign(ma.pts - mb.pts);
        if (!h2hExtra) {
          const fa = full.get(sa)!;
          const fb = full.get(sb)!;
          const gda = fa.gf - fa.ga;
          const gdb = fb.gf - fb.ga;
          if (gda !== gdb) return -Math.sign(gda - gdb);
          return -Math.sign(fa.gf - fb.gf);
        }
        if (ma.gd !== mb.gd) return -Math.sign(ma.gd - mb.gd);
        return -Math.sign(ma.gf - mb.gf);
      });
      out.push(...inner);
    }
    i = j;
  }
  return out;
}

export function computeGroupStandings(
  memberSlots: number[],
  names: string[],
  matches: StandingMatch[],
  rule: GroupRankingRuleId,
  presetId: GroupPointsPresetId,
  countingMode: CountingMode,
  h2hIncludesGdGf: boolean,
): GroupStandingRow[] {
  const preset = pointsFromPreset(presetId);
  const full = new Map<
    number,
    { pts: number; gf: number; ga: number; played: number }
  >();
  for (const s of memberSlots) {
    full.set(s, { pts: 0, gf: 0, ga: 0, played: 0 });
  }
  const groupSet = new Set(memberSlots);
  for (const m of matches) {
    if (!finished(m)) continue;
    if (!groupSet.has(m.slot_home) || !groupSet.has(m.slot_away)) continue;
    let [gh, ga] = [m.goals_home!, m.goals_away!];
    [gh, ga] = applyCountingMode(gh, ga, countingMode);
    const a = full.get(m.slot_home)!;
    const b = full.get(m.slot_away)!;
    a.played++;
    b.played++;
    a.gf += gh;
    a.ga += ga;
    b.gf += ga;
    b.ga += gh;
    if (gh > ga) {
      a.pts += preset.win;
      b.pts += preset.loss;
    } else if (gh < ga) {
      a.pts += preset.loss;
      b.pts += preset.win;
    } else {
      a.pts += preset.draw;
      b.pts += preset.draw;
    }
  }

  const order = sortGroupSlots(
    memberSlots,
    matches,
    rule,
    presetId,
    countingMode,
    h2hIncludesGdGf,
  );

  const orderCrit = criteriaOrder(rule);
  let rank = 1;
  const rows: GroupStandingRow[] = [];
  for (let idx = 0; idx < order.length; idx++) {
    const slot = order[idx]!;
    if (idx > 0) {
      const prev = order[idx - 1]!;
      if (
        compareSlots(
          prev,
          slot,
          full,
          matches,
          orderCrit,
          preset,
          countingMode,
          h2hIncludesGdGf,
        ) !== 0
      ) {
        rank = idx + 1;
      }
    }
    const st = full.get(slot)!;
    const name =
      String(names[slot] ?? "").trim() || `${slot + 1}. Teilnehmer`;
    rows.push({
      rank,
      slot,
      name,
      played: st.played,
      goalsFor: st.gf,
      goalsAgainst: st.ga,
      goalDiff: st.gf - st.ga,
      points: st.pts,
    });
  }

  return rows;
}
