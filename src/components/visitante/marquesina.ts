import { Press_Start_2P } from "next/font/google";

// The old app's title face. Only the public app loads it.
const wide = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-press",
});

/** Turns on the marquee look (globals.css) for an org without a skin. */
export const MARQUESINA = `marquesina ${wide.variable}`;
