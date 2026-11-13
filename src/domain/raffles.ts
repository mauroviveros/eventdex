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
 * The names that go by on stage, at random but never the same one twice in a
 * row (when there is another to show). The winner is not here: the server
 * already chose it, and the screen only lands on it afterwards.
 */
export function stageFrames(
  names: readonly string[],
  count: number,
  random: () => number = Math.random,
) {
  if (names.length === 0) return [];
  const frames: string[] = [];
  for (let i = 0; i < count; i++) {
    const previous = frames.at(-1);
    const pool =
      names.length > 1 ? names.filter((n) => n !== previous) : [...names];
    frames.push(pool[Math.floor(random() * pool.length)] ?? "");
  }
  return frames;
}
