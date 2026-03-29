import type { GroupStandingRow } from "@/lib/group-standings";
import type { CountingMode } from "@/lib/tournament-modes";

export type KoStandingsBlock = {
  groupCode: string;
  rows: GroupStandingRow[];
};

export type KoDisplaySide = {
  primary: string;
  resolved: boolean;
};

type MatchLite = {
  id: string;
  sort_index: number;
  group_code: string;
  label_home?: string | null;
  label_away?: string | null;
  slot_home: number | null;
  slot_away: number | null;
  goals_home: number | null;
  goals_away: number | null;
};

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

function participantLabel(names: string[], slot: number): string {
  const s = String(names[slot] ?? "").trim();
  return s || `${slot + 1}. Teilnehmer`;
}

function buildGroupRowsMap(blocks: KoStandingsBlock[]) {
  const m = new Map<string, GroupStandingRow[]>();
  for (const b of blocks) {
    if (b.groupCode) m.set(b.groupCode.toUpperCase(), b.rows);
  }
  return m;
}

/** Genau eine Vorrunden-Tabelle (1 Gruppe): für „k. Platz Vorrunde“. */
function singleTableRows(blocks: KoStandingsBlock[]): GroupStandingRow[] | null {
  if (blocks.length !== 1) return null;
  return blocks[0]!.rows;
}

/**
 * k = 1 → erster in der sortierten Tabelle (Tabellenführer), k = 2 → zweiter usw.
 * So sind „1. Platz Gruppe …“-Platzhalter schon vor dem ersten Spiel lesbar
 * (bei Punktgleichheit wie in der linken Tabellenansicht).
 */
function slotAtTablePlacement(
  rows: GroupStandingRow[],
  placement: number,
): number | null {
  if (placement < 1 || placement > rows.length) return null;
  return rows[placement - 1]?.slot ?? null;
}

/**
 * Liefert je KO-Spiel angezeigte Teamnamen: aus Vorrunden-Tabellen und
 * aus „Sieger/Verlierer …“ sobald Vorläufer-Spiele entschieden sind.
 *
 * @param resolveGroupPlacements – Wenn false, werden Platzhalter wie
 * „1. Platz Gruppe A“ noch nicht in Teilnehmernamen aufgelöst (sinnvoll,
 * solange in der Vorrunde noch kein einziges Ergebnis eingetragen wurde).
 */
export function computeKoMatchDisplays(
  koMatches: MatchLite[],
  standingsBlocks: KoStandingsBlock[],
  participantNames: string[],
  countingMode: CountingMode,
  resolveGroupPlacements: boolean,
): Map<string, { home: KoDisplaySide; away: KoDisplaySide }> {
  const sorted = [...koMatches].sort((a, b) => a.sort_index - b.sort_index);
  const vfList = sorted.filter((m) => m.group_code === "VF");
  const hfList = sorted.filter((m) => m.group_code === "HF");
  const khfList = sorted.filter((m) => m.group_code === "KHF");

  const groupRowsMap = buildGroupRowsMap(standingsBlocks);
  const singleRows = singleTableRows(standingsBlocks);
  const slotPairById = new Map<string, { h: number | null; a: number | null }>();

  function winnerSlot(m: MatchLite): number | null {
    const pair = slotPairById.get(m.id);
    if (!pair || pair.h == null || pair.a == null) return null;
    if (m.goals_home == null || m.goals_away == null) return null;
    const [eh, ea] = applyCountingMode(
      m.goals_home,
      m.goals_away,
      countingMode,
    );
    if (eh > ea) return pair.h;
    if (ea > eh) return pair.a;
    return null;
  }

  function loserSlot(m: MatchLite): number | null {
    const pair = slotPairById.get(m.id);
    if (!pair || pair.h == null || pair.a == null) return null;
    if (m.goals_home == null || m.goals_away == null) return null;
    const [eh, ea] = applyCountingMode(
      m.goals_home,
      m.goals_away,
      countingMode,
    );
    if (eh < ea) return pair.h;
    if (ea < eh) return pair.a;
    return null;
  }

  function labelToSlot(labelRaw: string): number | null {
    const label = labelRaw.trim();
    if (!label) return null;

    const mg = label.match(/^(\d+)\.\s*Platz\s+Gruppe\s+([A-Za-z])$/i);
    if (mg) {
      if (!resolveGroupPlacements) return null;
      const place = parseInt(mg[1]!, 10);
      const letter = mg[2]!.toUpperCase();
      const rows = groupRowsMap.get(letter);
      if (!rows) return null;
      return slotAtTablePlacement(rows, place);
    }

    const mv = label.match(/^(\d+)\.\s*Platz\s+Vorrunde$/i);
    if (mv) {
      if (!resolveGroupPlacements) return null;
      const place = parseInt(mv[1]!, 10);
      if (!singleRows) return null;
      return slotAtTablePlacement(singleRows, place);
    }

    const svf = label.match(/^Sieger\s+VF\s*(\d+)$/i);
    if (svf) {
      const idx = parseInt(svf[1]!, 10) - 1;
      if (idx < 0 || idx >= vfList.length) return null;
      return winnerSlot(vfList[idx]!);
    }

    const shf = label.match(/^Sieger\s+Halbfinale\s*(\d+)$/i);
    if (shf) {
      const idx = parseInt(shf[1]!, 10) - 1;
      if (idx < 0 || idx >= hfList.length) return null;
      return winnerSlot(hfList[idx]!);
    }

    const vhf = label.match(/^Verlierer\s+Halbfinale\s*(\d+)$/i);
    if (vhf) {
      const idx = parseInt(vhf[1]!, 10) - 1;
      if (idx < 0 || idx >= hfList.length) return null;
      return loserSlot(hfList[idx]!);
    }

    const skhf = label.match(/^Sieger\s+KHF\s*(\d+)$/i);
    if (skhf) {
      const idx = parseInt(skhf[1]!, 10) - 1;
      if (idx < 0 || idx >= khfList.length) return null;
      return winnerSlot(khfList[idx]!);
    }

    return null;
  }

  function directOrLabel(
    label: string | null | undefined,
    direct: number | null,
  ): number | null {
    if (direct != null) return direct;
    return labelToSlot(String(label ?? ""));
  }

  for (const m of sorted) {
    const hs = directOrLabel(m.label_home, m.slot_home);
    const as = directOrLabel(m.label_away, m.slot_away);
    slotPairById.set(m.id, { h: hs, a: as });
  }

  const out = new Map<string, { home: KoDisplaySide; away: KoDisplaySide }>();
  for (const m of sorted) {
    const hs = slotPairById.get(m.id)!.h;
    const as = slotPairById.get(m.id)!.a;
    const lh = String(m.label_home ?? "").trim();
    const la = String(m.label_away ?? "").trim();

    const home: KoDisplaySide =
      hs != null
        ? { primary: participantLabel(participantNames, hs), resolved: true }
        : { primary: lh || "—", resolved: false };

    const away: KoDisplaySide =
      as != null
        ? { primary: participantLabel(participantNames, as), resolved: true }
        : { primary: la || "—", resolved: false };

    out.set(m.id, { home, away });
  }

  return out;
}
