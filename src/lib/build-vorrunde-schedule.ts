import { roundRobinRoundsLocal } from "@/lib/round-robin";
import { getGroupLayout, type GroupSegment } from "@/lib/tournament-modes";

export function segmentLabelToGroupCode(label: string): string {
  const m = label.match(/Gruppe\s+([A-D])\s*$/i);
  return m ? m[1]!.toUpperCase() : "";
}

type LocalPair = { la: number; lb: number };

function randomIntInclusive(max: number): number {
  if (max <= 0) return 0;
  return Math.floor(Math.random() * (max + 1));
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomIntInclusive(i);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
}

/** Zufällige Permutation von 0 .. n-1 (für Los-Zuordnung in der Gruppe). */
function randomPermutation(n: number): number[] {
  const perm = Array.from({ length: n }, (_, i) => i);
  shuffleInPlace(perm);
  return perm;
}

function orderedPairsForGroup(size: number): LocalPair[] {
  const rounds = roundRobinRoundsLocal(size);
  const pairs: LocalPair[] = [];
  for (const round of rounds) {
    for (const [la, lb] of round) {
      pairs.push({ la, lb });
    }
  }
  return pairs;
}

/**
 * Round-Robin-Paarungen mit zufälliger Slot-Zuordnung pro Gruppe,
 * zufälliger Spielreihenfolge und zufälliger Heim-/Auswärts-Seite.
 */
function randomizedPairsForGroup(size: number): LocalPair[] {
  if (size < 2) return [];
  const perm = randomPermutation(size);
  const raw = orderedPairsForGroup(size);
  const pairs: LocalPair[] = raw.map(({ la, lb }) => {
    let a = perm[la]!;
    let b = perm[lb]!;
    if (Math.random() < 0.5) [a, b] = [b, a];
    return { la: a, lb: b };
  });
  shuffleInPlace(pairs);
  return pairs;
}

export type BuiltMatchRow = {
  sort_index: number;
  group_code: string;
  pitch: number;
  start_time: string | null;
  slot_home: number;
  slot_away: number;
};

/**
 * Vorrunde: Jeder gegen jeden pro Gruppe.
 * Bei mehreren Gruppen werden die Spiele **abwechselnd** eingeplant (A, B, C, A, B, …).
 * Innerhalb jeder Gruppe sind die Paarungen ein Jeder-gegen-jeden; Zuordnung der Teilnehmer
 * zu den RR-Plätzen, Reihenfolge der Spiele und Heim/Auswärts werden **zufällig** gewählt.
 * Keine Uhrzeiten – Platzhalter in der DB bleibt null.
 */
export function buildVorrundeMatchPlan(
  modusKey: string,
  teamCount: number,
  courtCount: number,
): BuiltMatchRow[] {
  const segments = getGroupLayout(modusKey || "rr_1", teamCount);
  if (!segments.length || teamCount < 2) return [];

  const courts = Math.max(1, Math.min(99, courtCount));

  let globalOffset = 0;
  type Queued = {
    code: string;
    offset: number;
    pairs: LocalPair[];
  };
  const groupQueues: Queued[] = segments.map((seg) => {
    const code = segmentLabelToGroupCode(seg.label);
    const pairs = randomizedPairsForGroup(seg.size);
    const offset = globalOffset;
    globalOffset += seg.size;
    return { code, offset, pairs: [...pairs] };
  });

  const out: BuiltMatchRow[] = [];
  let sortIndex = 0;

  if (groupQueues.length === 1) {
    const g = groupQueues[0]!;
    for (const { la, lb } of g.pairs) {
      out.push({
        sort_index: sortIndex,
        group_code: g.code,
        pitch: (sortIndex % courts) + 1,
        start_time: null,
        slot_home: g.offset + la,
        slot_away: g.offset + lb,
      });
      sortIndex++;
    }
    return out;
  }

  while (groupQueues.some((q) => q.pairs.length > 0)) {
    for (const g of groupQueues) {
      if (g.pairs.length === 0) continue;
      const { la, lb } = g.pairs.shift()!;
      out.push({
        sort_index: sortIndex,
        group_code: g.code,
        pitch: (sortIndex % courts) + 1,
        start_time: null,
        slot_home: g.offset + la,
        slot_away: g.offset + lb,
      });
      sortIndex++;
    }
  }

  return out;
}

export function segmentsForTournament(
  modusKey: string,
  teamCount: number,
): GroupSegment[] {
  return getGroupLayout(modusKey || "rr_1", teamCount);
}
