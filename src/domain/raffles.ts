/**
 * How a visitor is named in a raffle: "Ana García" → "Ana G.", a single name
 * as it is, and "Visitante" without one. Never the mail.
 *
 * A copy of app.public_name in the raffles migration, which freezes the
 * winner's name at the draw: if one changes, change the other.
 */
export function publicName(name: string | null | undefined) {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const [first] = words;
  if (!first) return "Visitante";
  const last = words.at(-1);
  if (!last || words.length === 1) return first;
  return `${first} ${last.charAt(0).toUpperCase()}.`;
}

/** Who can win, as the stage shows them: public name, medals and photo. */
export type Participant = {
  name: string;
  claims: number;
  avatarUrl: string | null;
};

/** How many names go by on stage before the winner lands. */
export const STAGE_FRAMES = 24;

/**
 * Milliseconds each name stays on screen: it starts brisk and slows down, so
 * the last ones are felt. Steps of the clock, not an easing curve.
 */
export function frameDelay(index: number) {
  return Math.round(60 + 0.6 * index * index);
}

/**
 * The participants that go by on stage, at random but never the same one twice in a
 * row (when there is another to show). The winner is not here: the server
 * already chose it, and the screen only lands on it afterwards.
 */
export function stageFrames<T>(
  items: readonly T[],
  count: number,
  random: () => number = Math.random,
) {
  const frames: T[] = [];
  if (items.length === 0) return frames;
  for (let i = 0; i < count; i++) {
    const previous = frames.at(-1);
    const others = items.filter((n) => n !== previous);
    // Every one the same (visitors without a name are all "Visitante"): repeat it.
    const pool = others.length > 0 ? others : items;
    frames.push(pool[Math.floor(random() * pool.length)] as T);
  }
  return frames;
}

/**
 * The name a profile gets in a raffle, by the same rule as the SQL that freezes
 * the winner's: coalesce(nullif(trim(display_name), ''), full_name).
 */
export function publicNameOf(
  profile: { display_name: string | null; full_name: string | null } | null,
) {
  return publicName(profile?.display_name?.trim() || profile?.full_name);
}

/** A list in pieces of at most `size`, in order. */
export function chunked<T>(items: readonly T[], size: number) {
  const pieces: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pieces.push(items.slice(i, i + size));
  }
  return pieces;
}
