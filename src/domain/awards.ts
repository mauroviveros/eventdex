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
