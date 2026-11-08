import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ACCENT, DANGER, SCANLINE } from "./palette";

// The contrast tests run on palette.ts; this keeps globals.css (what ships)
// saying the same thing, in light and in dark.
const css = readFileSync(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

describe("globals.css uses the tested color values", () => {
  it.each([
    ["--danger", DANGER.light, DANGER.dark],
    ["--accent-red", ACCENT.red.light, ACCENT.red.dark],
    ["--accent-yellow", ACCENT.yellow.light, ACCENT.yellow.dark],
    [
      "--scanline",
      `rgb(0 0 0 / ${SCANLINE.light})`,
      `rgb(0 0 0 / ${SCANLINE.dark})`,
    ],
  ])("%s", (token, light, dark) => {
    const values = [...css.matchAll(new RegExp(`${token}: ([^;]+);`, "g"))].map(
      (m) => m[1],
    );
    // Every declaration is one of the two tested values, and both appear.
    expect(values.length).toBeGreaterThanOrEqual(2);
    for (const value of values) expect([light, dark]).toContain(value);
    expect(values).toContain(light);
    expect(values).toContain(dark);
  });
});
