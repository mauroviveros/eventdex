/**
 * Merit awards: won by what the visitor did, not by chance. A rule is a number
 * of medals or a percentage of the event's active stands, with an optional cap
 * on how many can win ("the first 5 to complete").
 */

export type AwardRule = { kind: "count" | "percent"; threshold: number };

/**
 * Medals the rule asks for. A percentage rounds up and asks for at least one,
 * the same as the database (`app.grant_awards`), which is who decides.
 */
export function awardNeeded(rule: AwardRule, totalSpots: number) {
  return rule.kind === "count"
    ? rule.threshold
    : Math.max(1, Math.ceil((totalSpots * rule.threshold) / 100));
}

export type AwardInput = AwardRule & {
  /** Null: everyone who gets there wins. */
  slots: number | null;
  /** How many already won it. */
  taken: number;
};

export type AwardStanding = {
  needed: number;
  /** Medals still missing; 0 once reached. */
  missing: number;
  reached: boolean;
  /** Places left, or null when there is no cap. */
  slotsLeft: number | null;
  /** The cap is full: whoever arrives now wins nothing. */
  closed: boolean;
  /** Asks for more medals than the event has stands: nobody can win it. */
  unreachable: boolean;
};

export function awardStanding(
  award: AwardInput,
  claimed: number,
  totalSpots: number,
): AwardStanding {
  const needed = awardNeeded(award, totalSpots);
  const slotsLeft =
    award.slots === null ? null : Math.max(0, award.slots - award.taken);
  return {
    needed,
    missing: Math.max(0, needed - claimed),
    reached: claimed >= needed,
    slotsLeft,
    closed: slotsLeft === 0,
    unreachable: needed > totalSpots,
  };
}

/** What the award asks, in words: "todas las medallas", "3 medallas". */
export function awardRequirement(rule: AwardRule, totalSpots: number) {
  const needed = awardNeeded(rule, totalSpots);
  if (totalSpots > 1 && needed >= totalSpots) return "todas las medallas";
  return needed === 1
    ? "1 medalla"
    : `${needed.toLocaleString("es-AR")} medallas`;
}

export type AwardView = AwardStanding & {
  /** Won by this visitor, still open to them, or full for everyone else. */
  state: "ganado" | "abierto" | "agotado";
  /** The line over the title. */
  tag: string;
  /** What to do next, in a sentence. */
  phrase: string;
};

/**
 * What a visitor reads on an award's plate. `place` is their position when they
 * already won it, and `claimed` the medals they have.
 */
export function awardView(
  award: AwardInput,
  claimed: number,
  totalSpots: number,
  place: number | null,
): AwardView {
  const standing = awardStanding(award, claimed, totalSpots);
  if (place !== null) {
    return {
      ...standing,
      state: "ganado",
      tag: `Ganado · lugar ${place}`,
      phrase: "Retiralo en la organización.",
    };
  }
  if (standing.closed) {
    return {
      ...standing,
      state: "agotado",
      tag: "Se agotó",
      phrase:
        award.slots === 1
          ? "Ya lo ganó la primera persona en llegar."
          : `Ya lo ganaron las ${award.slots} primeras personas.`,
    };
  }
  const ask = `Juntá ${awardRequirement(award, totalSpots)}${award.slots === null ? "" : " antes que nadie"}.`;
  return {
    ...standing,
    state: "abierto",
    tag:
      award.slots === null
        ? "Por mérito · Sin cupo"
        : `Por mérito · Quedan ${standing.slotsLeft} de ${award.slots}`,
    phrase:
      claimed > 0 && standing.missing > 0
        ? `${ask} Te ${standing.missing === 1 ? "falta 1" : `faltan ${standing.missing}`}.`
        : ask,
  };
}

/** The awards a visitor can see: one nobody can reach is left out, like a raffle. */
export const reachableAwards = <T extends AwardRule>(
  awards: readonly T[],
  totalSpots: number,
) => awards.filter((a) => awardNeeded(a, totalSpots) <= totalSpots);
