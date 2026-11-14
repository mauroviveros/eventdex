/**
 * What a visitor sees of the raffles: each prize, how far they are from it and
 * the sentence that says so. Pure: the page passes the raffles, the medals the
 * visitor has and how many stands the event has.
 */

export type PrizeInput = { id: string; title: string; minClaims: number };

export type Prize = PrizeInput & {
  /** `reached`: already in. `next`: the closest one left. `later`: further up the ladder. */
  status: "reached" | "next" | "later";
  /** Medals still missing; 0 once reached. */
  missing: number;
  phrase: string;
};

export type PrizeLadder = {
  /** From the lowest minimum to the highest; the ones nobody can reach are left out. */
  prizes: Prize[];
  /** The closest prize still to win, if any. */
  next: Prize | null;
  /** The highest prize already reached, if any. */
  reached: Prize | null;
  /** Raffles that ask for more medals than the event has stands: the panel warns about them. */
  unreachable: PrizeInput[];
};

function phraseFor(
  { title, minClaims }: PrizeInput,
  claimed: number,
  reached: boolean,
) {
  if (reached) return `Ya estás en el sorteo de ${title}`;
  if (claimed > 0) {
    const missing = minClaims - claimed;
    return `${missing === 1 ? "Te falta 1" : `Te faltan ${missing}`} para el sorteo de ${title}`;
  }
  if (minClaims === 1) {
    return `Con tu primera medalla ya entrás al sorteo de ${title}`;
  }
  return `Juntá ${minClaims} medallas y entrás al sorteo de ${title}`;
}

export function prizeLadder(
  raffles: readonly PrizeInput[],
  claimed: number,
  totalSpots: number,
): PrizeLadder {
  const sorted = [...raffles].sort(
    (a, b) => a.minClaims - b.minClaims || a.title.localeCompare(b.title, "es"),
  );
  const unreachable = sorted.filter((r) => r.minClaims > totalSpots);
  const firstPending = sorted.find(
    (r) => r.minClaims <= totalSpots && r.minClaims > claimed,
  );

  const prizes = sorted
    .filter((r) => r.minClaims <= totalSpots)
    .map((r): Prize => {
      const reached = r.minClaims <= claimed;
      return {
        ...r,
        status: reached ? "reached" : r === firstPending ? "next" : "later",
        missing: reached ? 0 : r.minClaims - claimed,
        phrase: phraseFor(r, claimed, reached),
      };
    });

  return {
    prizes,
    next: prizes.find((p) => p.status === "next") ?? null,
    reached: prizes.findLast((p) => p.status === "reached") ?? null,
    unreachable,
  };
}

/** From here on an event has "many" stands: a raffle that asks for one medal stops pulling visitors along. */
export const MANY_SPOTS = 5;

/**
 * The panel's soft warning: every prize the event can give asks for a single
 * medal, so the raffle only motivates the first scan and no more.
 */
export function onlyFirstMedal(
  raffles: readonly PrizeInput[],
  totalSpots: number,
) {
  const reachable = raffles.filter((r) => r.minClaims <= totalSpots);
  return (
    totalSpots > MANY_SPOTS &&
    reachable.length > 0 &&
    reachable.every((r) => r.minClaims === 1)
  );
}

/** The line printed on every QR card: why to scan. Null when there is no prize to name. */
export function prizesHook(prizeCount: number) {
  if (prizeCount <= 0) return null;
  return `Escaneá · ${prizeCount === 1 ? "1 premio" : `${prizeCount} premios`} en juego`;
}
