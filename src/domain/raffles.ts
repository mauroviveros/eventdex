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
