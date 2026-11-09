import type { Ramp } from "@/domain/palette";

/** The poster's paper and ink: cream, a darker cream, warm grey, near black. */
export const RAMP: Ramp = [
  "oklch(0.89 0.012 100)",
  "oklch(0.79 0.02 90)",
  "oklch(0.44 0.02 60)",
  "oklch(0.17 0.006 60)",
];

/** The poster's red, the only accent: date, venue and title all wear it. */
export const ACCENT = {
  light: "oklch(0.46 0.16 25)",
  dark: "oklch(0.68 0.19 27)",
} as const;
