import { Anton } from "next/font/google";
import type { Skin } from "@/skins/types";
import { ACCENT, RAMP } from "./palette";
import "./skin.css";

// shortcut: every public org preloads each skin's font, split it by skin past 3 skins
const display = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bt-display",
});

export const burningTower: Skin = {
  name: "burning-tower",
  fontClass: display.variable,
  ramp: RAMP,
  vars: {
    "--skin-accent-light": ACCENT.light,
    "--skin-accent-dark": ACCENT.dark,
  },
  image: { font: "Anton", charWidth: 0.5, accent: ACCENT.light },
};
