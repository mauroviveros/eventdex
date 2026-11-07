import { describe, expect, it } from "vitest";
import {
  contrast,
  DANGER,
  distance,
  EVENTDEX_HUE,
  ramp,
  rampFromHex,
} from "./palette";

const hues = Array.from({ length: 36 }, (_, i) => i * 10);

describe("ramp contrast holds for every hue", () => {
  it.each(hues)("hue %i", (hue) => {
    const [t0, t1, t2, t3] = ramp(hue);
    // Body text: ink on ground.
    expect(contrast(t3, t0)).toBeGreaterThanOrEqual(7);
    // Secondary text and 2 px rules on ground.
    expect(contrast(t2, t0)).toBeGreaterThanOrEqual(4.5);
    // Ink on filled areas (progress, pending medals, buttons).
    expect(contrast(t3, t1)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("dark scheme reverses the ramp and keeps the same pairs", () => {
  it.each(hues)("hue %i", (hue) => {
    const [t0, t1, t2, t3] = ramp(hue);
    // Ground t3, ink t0, secondary t1, fill t2.
    expect(contrast(t0, t3)).toBeGreaterThanOrEqual(7);
    expect(contrast(t1, t3)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t0, t2)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("danger stays legible and distinct from every ramp", () => {
  it.each(hues)("hue %i", (hue) => {
    const tones = ramp(hue);
    expect(contrast(DANGER.light, tones[0])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(DANGER.dark, tones[3])).toBeGreaterThanOrEqual(4.5);
    for (const tone of tones) {
      expect(distance(DANGER.light, tone)).toBeGreaterThanOrEqual(0.1);
      expect(distance(DANGER.dark, tone)).toBeGreaterThanOrEqual(0.1);
    }
  });
});

describe("rampFromHex", () => {
  it("takes the hue of the brand color", () => {
    const hue = Number(rampFromHex("#1e66f5")[3].split(" ")[2]?.slice(0, -1));
    expect(hue).toBeGreaterThan(255);
    expect(hue).toBeLessThan(270);
  });

  it("turns a grey brand into a grey ramp", () => {
    expect(rampFromHex("#777777")[0]).toMatch(/^oklch\(0\.94 0 /);
  });

  it("falls back to the Eventdex ramp on invalid input", () => {
    expect(rampFromHex("verde")).toEqual(ramp(EVENTDEX_HUE));
  });
});
