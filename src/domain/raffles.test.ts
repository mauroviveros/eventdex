import { describe, expect, it } from "vitest";
import { frameDelay, publicName, STAGE_FRAMES, stageFrames } from "./raffles";

// The same cases as app.public_name in the raffles migration.
describe("publicName", () => {
  it.each([
    ["Ana García", "Ana G."],
    ["Ana María García", "Ana G."],
    ["  Ana   García  ", "Ana G."],
    ["ana garcía", "ana G."],
    ["Ana", "Ana"],
    ["", "Visitante"],
    ["   ", "Visitante"],
  ])("turns %j into %j", (name, expected) => {
    expect(publicName(name)).toBe(expected);
  });

  it("falls back to Visitante without a name", () => {
    expect(publicName(null)).toBe("Visitante");
    expect(publicName(undefined)).toBe("Visitante");
  });
});

describe("stageFrames", () => {
  // A deterministic "random": walks the list from a seed.
  const walk = (seed: number) => {
    let n = seed;
    return () => {
      n = (n * 7 + 3) % 101;
      return n / 101;
    };
  };

  it("gives as many frames as asked, all from the list", () => {
    const names = ["Ana G.", "Beto P.", "Cris L."];
    const frames = stageFrames(names, 20, walk(1));
    expect(frames).toHaveLength(20);
    for (const frame of frames) expect(names).toContain(frame);
  });

  it("never repeats a name twice in a row when there is a choice", () => {
    const frames = stageFrames(["Ana G.", "Beto P."], 40, walk(5));
    for (const [i, frame] of frames.entries()) {
      if (i > 0) expect(frame).not.toBe(frames[i - 1]);
    }
  });

  it("repeats the only name there is", () => {
    expect(stageFrames(["Ana G."], 3, walk(2))).toEqual([
      "Ana G.",
      "Ana G.",
      "Ana G.",
    ]);
  });

  it("has nothing to show without participants", () => {
    expect(stageFrames([], 10, walk(1))).toEqual([]);
  });
});

describe("frameDelay", () => {
  it("slows down towards the end, in steps and never backwards", () => {
    const delays = Array.from({ length: STAGE_FRAMES }, (_, i) =>
      frameDelay(i),
    );
    for (const [i, delay] of delays.entries()) {
      if (i > 0) expect(delay).toBeGreaterThanOrEqual(delays[i - 1] ?? 0);
    }
    expect(delays[0]).toBeLessThan(delays.at(-1) ?? 0);
  });

  it("takes a few seconds in all, not a minute", () => {
    const total = Array.from({ length: STAGE_FRAMES }, (_, i) =>
      frameDelay(i),
    ).reduce((sum, d) => sum + d, 0);
    expect(total).toBeGreaterThan(2000);
    expect(total).toBeLessThan(6000);
  });
});
