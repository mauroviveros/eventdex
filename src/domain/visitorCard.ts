import { formatEventDates } from "@/domain/events";

/** Two rows: what a visitor shows off, not an inventory. The count says the rest. */
export const CARD_MEDALS_SHOWN = 12;

/** Made to be shared: never prints the mail of a profile without a name. */
export const cardName = (account: { name: string; email: string }) =>
  account.name === account.email ? "Visitante" : account.name;

export const cardDetails = (
  event: {
    edition_label: string | null;
    schedules: Parameters<typeof formatEventDates>[0];
    timezone: string;
    venue: { name: string } | null;
  },
  now: Date,
) =>
  [
    event.edition_label,
    formatEventDates(event.schedules, event.timezone, now),
    event.venue?.name,
  ]
    .filter(Boolean)
    .join(" · ");

export function cardCount(count: number, total: number) {
  if (count === total && count > 1) return `¡Las ${count} medallas!`;
  return `${count} ${count === 1 ? "medalla" : "medallas"}`;
}

/**
 * The line a merit award adds to the card: the place in the award with a cap
 * ("Lugar 2 de los primeros 5"), else the award's name. Null without wins.
 */
export function cardAward(
  wins: readonly { title: string; position: number; slots: number | null }[],
) {
  const lead = wins.find((w) => w.slots !== null) ?? wins[0];
  if (!lead) return null;
  return lead.slots === null
    ? `Ganó ${lead.title}`
    : `Lugar ${lead.position} de los primeros ${lead.slots}`;
}
