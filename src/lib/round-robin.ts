/** Jeder-gegen-jeden (Circle-Methode), lokale Indizes 0 .. n-1 pro Gruppe. */

export function roundRobinRoundsLocal(
  teamCount: number,
): [number, number][][] {
  const n = teamCount;
  if (n < 2) return [];

  const bye = -1;
  const ids = Array.from({ length: n }, (_, i) => i);
  if (n % 2 === 1) ids.push(bye);

  const R = ids.length;
  const teams = [...ids];
  const rounds: [number, number][][] = [];

  for (let r = 0; r < R - 1; r++) {
    const pairs: [number, number][] = [];
    for (let j = 0; j < R / 2; j++) {
      const a = teams[j]!;
      const b = teams[R - 1 - j]!;
      if (a !== bye && b !== bye) pairs.push([a, b]);
    }
    rounds.push(pairs);
    teams.splice(1, 0, teams.pop()!);
  }

  return rounds;
}
