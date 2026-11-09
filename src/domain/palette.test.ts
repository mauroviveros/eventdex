import { describe, expect, it } from "vitest";
import {
  ACCENT,
  contrast,
  DANGER,
  distance,
  EVENTDEX_COLOR,
  EVENTDEX_HUE,
  ramp,
  rampFromHex,
  SCANLINE,
  toRgb,
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

describe("marquee accents stay legible on every ramp", () => {
  it.each(hues)("hue %i", (hue) => {
    const tones = ramp(hue);
    for (const accent of Object.values(ACCENT)) {
      // Light: on the ground (ramp-0). Dark: on the inverted ground (ramp-3).
      expect(contrast(accent.light, tones[0])).toBeGreaterThanOrEqual(4.5);
      expect(contrast(accent.dark, tones[3])).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("text stays AA on the light scanline rows", () => {
  // Browsers blend the black stripe over the ground in gamma-encoded sRGB.
  const luminance = (rgb: readonly number[]) =>
    rgb
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
      .reduce((sum, c, i) => sum + c * ([0.2126, 0.7152, 0.0722][i] ?? 0), 0);
  const ratio = (a: readonly number[], b: readonly number[]) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
  };

  it.each(hues)("hue %i", (hue) => {
    const [t0, , t2] = ramp(hue);
    const striped = toRgb(t0).map((c) => c * (1 - SCANLINE.light));
    expect(ratio(toRgb(t2), striped)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(toRgb(ACCENT.yellow.light), striped)).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(ratio(toRgb(ACCENT.red.light), striped)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("rampFromHex", () => {
  it("takes the hue of the brand color", () => {
    const hue = Number(rampFromHex("#1e66f5")[3].split(" ")[2]?.slice(0, -1));
    expect(hue).toBeGreaterThan(255);
    expect(hue).toBeLessThan(270);
  });

  it("has a default color on Eventdex's own hue", () => {
    const hue = Number(
      rampFromHex(EVENTDEX_COLOR)[3].split(" ")[2]?.slice(0, -1),
    );
    expect(Math.abs(hue - EVENTDEX_HUE)).toBeLessThan(2);
  });

  it("turns a grey brand into a grey ramp", () => {
    expect(rampFromHex("#777777")[0]).toMatch(/^oklch\(0\.94 0 /);
  });

  it("falls back to the Eventdex ramp on invalid input", () => {
    expect(rampFromHex("verde")).toEqual(ramp(EVENTDEX_HUE));
  });
});
