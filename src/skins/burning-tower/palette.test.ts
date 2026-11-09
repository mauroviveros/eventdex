import { describe, expect, it } from "vitest";
import { contrast, DANGER, distance } from "@/domain/palette";
import { ACCENT, RAMP } from "./palette";

// A skin picks its lightness by hand, so it doesn't get rampFromHex's guarantee.
const [t0, t1, t2, t3] = RAMP;

describe("Burning Tower keeps the pairs every ramp keeps", () => {
  it("in light: ground t0, fill t1, secondary t2, ink t3", () => {
    expect(contrast(t3, t0)).toBeGreaterThanOrEqual(7);
    expect(contrast(t2, t0)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t3, t1)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(ACCENT.light, t0)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(DANGER.light, t0)).toBeGreaterThanOrEqual(4.5);
  });

  it("in dark: ground t3, fill t2, secondary t1, ink t0", () => {
    expect(contrast(t0, t3)).toBeGreaterThanOrEqual(7);
    expect(contrast(t1, t3)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t0, t2)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(ACCENT.dark, t3)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(DANGER.dark, t3)).toBeGreaterThanOrEqual(4.5);
  });

  it("danger stays distinct from the tones", () => {
    for (const tone of RAMP) {
      expect(distance(DANGER.light, tone)).toBeGreaterThanOrEqual(0.1);
      expect(distance(DANGER.dark, tone)).toBeGreaterThanOrEqual(0.1);
    }
  });
});
