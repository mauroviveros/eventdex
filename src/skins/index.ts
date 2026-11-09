import { burningTower } from "./burning-tower/skin";
import type { Skin } from "./types";

// shortcut: skin tied to the slug and shipped with a deploy, move to a column if an owner has to pick it
const SKINS = new Map<string, Skin>([["burning-tower-fest", burningTower]]);

/** The org's made-to-measure look, or undefined for the LCD with its brand color. */
export function skinFor(orgSlug: string) {
  return SKINS.get(orgSlug);
}
