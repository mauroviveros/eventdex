/**
 * The visitor's history in one organization: the editions they played, what
 * they collected and the stamps that reward coming back. Pure: the reads that
 * feed it live in src/lib/data. Instants stay ISO strings in UTC.
 */

/** One published edition of the org, whether or not the visitor came. */
export type HistoryEdition = {
  id: string;
  title: string;
  editionLabel: string | null;
  /** First schedule's start. */
  startsAt: string;
  came: boolean;
  medals: number;
  /** Active spots the event had: what a full collection means. */
  total: number;
  /** Raffle draws the visitor won there. */
  wins: number;
};

export const STAMPS = {
  "primera-edicion": "Estuviste en la primera edición",
  "tres-seguidas": "Tres ediciones seguidas",
  "coleccion-completa": "Colección completa",
  ganador: "Ganaste un sorteo",
} as const;
export type StampId = keyof typeof STAMPS;

const STREAK = 3;

const byStart = (a: HistoryEdition, b: HistoryEdition) =>
  Date.parse(a.startsAt) - Date.parse(b.startsAt);

// shortcut: a series is the editions that share a title, move to a real series id when the ROADMAP's series (⏸) exist
function groupByTitle(editions: readonly HistoryEdition[]) {
  const groups = new Map<string, HistoryEdition[]>();
  for (const e of [...editions].sort(byStart)) {
    groups.set(e.title, [...(groups.get(e.title) ?? []), e]);
  }
  return [...groups.entries()];
}

/** Longest run of editions the visitor came to, with none missed between. */
function longestRun(series: readonly HistoryEdition[]) {
  let best = 0;
  let run = 0;
  for (const e of series) {
    run = e.came ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

export function buildHistory(editions: readonly HistoryEdition[]) {
  const played = editions
    .filter((e) => e.came)
    .sort(byStart)
    .reverse();
  const groups = groupByTitle(editions);

  const series = groups
    .map(([title, list]) => ({
      title,
      came: list.filter((e) => e.came).length,
      of: list.length,
    }))
    .filter((s) => s.came > 0);

  const earned: Record<StampId, boolean> = {
    "primera-edicion": groups.some(
      ([, list]) => list.length > 1 && list[0]?.came,
    ),
    "tres-seguidas": groups.some(([, list]) => longestRun(list) >= STREAK),
    "coleccion-completa": played.some(
      (e) => e.total > 0 && e.medals >= e.total,
    ),
    ganador: played.some((e) => e.wins > 0),
  };

  return {
    played,
    totals: {
      events: played.length,
      medals: played.reduce((sum, e) => sum + e.medals, 0),
      wins: played.reduce((sum, e) => sum + e.wins, 0),
    },
    since: played.at(-1)?.startsAt ?? null,
    series,
    stamps: (Object.keys(STAMPS) as StampId[])
      .filter((id) => earned[id])
      .map((id) => ({ id, label: STAMPS[id] })),
  };
}
