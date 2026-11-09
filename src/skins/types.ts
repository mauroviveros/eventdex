import type { Ramp } from "@/domain/palette";

/** A look made to measure for one organization. Plain strings: it crosses to client components. */
export type Skin = {
  /** The value of data-skin, which scopes the skin's CSS. */
  name: string;
  /** next/font's class, which defines the skin's font variable. */
  fontClass: string;
  ramp: Ramp;
  /** Extra custom properties, set beside the ramp. */
  vars: Record<string, string>;
};
