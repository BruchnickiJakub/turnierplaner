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

/** Round-Robin-Runden mit zufälliger Slot-Zuordnung pro Gruppe. */
function randomizedRoundsForGroup(size: number): LocalPair[][] {
  if (size < 2) return [];
  const perm = randomPermutation(size);
  const rawRounds = roundRobinRoundsLocal(size);
  const rounds = rawRounds.map((round) => {
    const mapped = round.map(([la, lb]) => {
      let a = perm[la]!;
      let b = perm[lb]!;
      if (Math.random() < 0.5) [a, b] = [b, a];
      return { la: a, lb: b };
    });
    shuffleInPlace(mapped);
    return mapped;
  });
  return rounds;
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
 * Die Planung erfolgt wellenförmig über alle Plätze mit Fairness-Heuristik:
 * - direkte Folgeeinsätze werden, wenn möglich, vermieden
 * - Einsätze werden gleichmäßig verteilt
 * - Rotation über Gruppen und Plätze bleibt ausgewogen
 * Paarungen bleiben ein Jeder-gegen-jeden pro Gruppe; Slot-Zuordnung und Heim/Auswärts
 * werden weiterhin zufällig gelost.
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
  type GroupQueue = {
    code: string;
    offset: number;
    rounds: LocalPair[][];
    roundIndex: number;
    pairIndex: number;
  };
  const groupQueues: GroupQueue[] = segments.map((seg) => {
    const code = segmentLabelToGroupCode(seg.label);
    const rounds = randomizedRoundsForGroup(seg.size);
    const offset = globalOffset;
    globalOffset += seg.size;
    return { code, offset, rounds, roundIndex: 0, pairIndex: 0 };
  });

  const out: BuiltMatchRow[] = [];
  let sortIndex = 0;
  const playCounts = Array.from({ length: Math.max(0, teamCount) }, () => 0);
  const lastWavePlayed = new Map<number, number>();

  const hasRemainingMatches = () =>
    groupQueues.some((g) => g.roundIndex < g.rounds.length);

  const peekCurrentPair = (g: GroupQueue): LocalPair | null => {
    if (g.roundIndex >= g.rounds.length) return null;
    const round = g.rounds[g.roundIndex]!;
    if (g.pairIndex >= round.length) return null;
    return round[g.pairIndex]!;
  };

  const advanceGroupCursor = (g: GroupQueue) => {
    if (g.roundIndex >= g.rounds.length) return;
    const round = g.rounds[g.roundIndex]!;
    g.pairIndex += 1;
    if (g.pairIndex >= round.length) {
      g.roundIndex += 1;
      g.pairIndex = 0;
    }
  };

  type Candidate = {
    groupIdx: number;
    globalA: number;
    globalB: number;
    score: number;
  };

  const scoreCandidate = (
    wave: number,
    g: GroupQueue,
    groupIdx: number,
    pair: LocalPair,
  ): Candidate => {
    const globalA = g.offset + pair.la;
    const globalB = g.offset + pair.lb;
    const minPlays = playCounts.length > 0 ? Math.min(...playCounts) : 0;

    let score = 0;
    const lastA = lastWavePlayed.get(globalA);
    const lastB = lastWavePlayed.get(globalB);

    // Direkte Folgeeinsaetze stark vermeiden (wenn vermeidbar).
    if (lastA === wave - 1) score += 100;
    if (lastB === wave - 1) score += 100;

    // Spieler mit weniger Einsaetzen zuerst einplanen.
    score += (playCounts[globalA] ?? 0) - minPlays;
    score += (playCounts[globalB] ?? 0) - minPlays;

    // Leichte Zufallskomponente fuer variablere Plaene bei gleichem Score.
    score += Math.random() * 0.01;

    return {
      groupIdx,
      globalA,
      globalB,
      score,
    };
  };

  let wave = 0;
  while (hasRemainingMatches()) {
    const picked: Candidate[] = [];
    const usedInWave = new Set<number>();

    for (let slot = 0; slot < courts; slot++) {
      const candidates: Candidate[] = [];
      for (let i = 0; i < groupQueues.length; i++) {
        const g = groupQueues[i]!;
        const pair = peekCurrentPair(g);
        if (!pair) continue;
        const cand = scoreCandidate(wave, g, i, pair);
        if (usedInWave.has(cand.globalA) || usedInWave.has(cand.globalB)) continue;
        candidates.push(cand);
      }

      if (candidates.length === 0) break;
      candidates.sort((a, b) => a.score - b.score);
      const chosen = candidates[0]!;
      picked.push(chosen);
      usedInWave.add(chosen.globalA);
      usedInWave.add(chosen.globalB);
      advanceGroupCursor(groupQueues[chosen.groupIdx]!);
    }

    if (picked.length === 0) {
      for (let i = 0; i < groupQueues.length; i++) {
        const g = groupQueues[i]!;
        const pair = peekCurrentPair(g);
        if (!pair) continue;
        const forced = scoreCandidate(wave, g, i, pair);
        picked.push(forced);
        advanceGroupCursor(g);
        break;
      }
    }

    for (let i = 0; i < picked.length; i++) {
      const p = picked[i]!;
      const g = groupQueues[p.groupIdx]!;
      out.push({
        sort_index: sortIndex,
        group_code: g.code,
        pitch: i + 1,
        start_time: null,
        slot_home: p.globalA,
        slot_away: p.globalB,
      });
      playCounts[p.globalA] = (playCounts[p.globalA] ?? 0) + 1;
      playCounts[p.globalB] = (playCounts[p.globalB] ?? 0) + 1;
      lastWavePlayed.set(p.globalA, wave);
      lastWavePlayed.set(p.globalB, wave);
      sortIndex++;
    }

    wave += 1;
  }

  return out;
}

export function segmentsForTournament(
  modusKey: string,
  teamCount: number,
): GroupSegment[] {
  return getGroupLayout(modusKey || "rr_1", teamCount);
}
