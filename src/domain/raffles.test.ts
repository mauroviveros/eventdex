import { describe, expect, it } from "vitest";
import {
  chunked,
  frameDelay,
  publicName,
  publicNameOf,
  STAGE_FRAMES,
  stageFrames,
} from "./raffles";

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

  // Visitors without a name are all "Visitante": there is no other to alternate with.
  it("repeats the name when every participant has the same one", () => {
    const frames = stageFrames(["Visitante", "Visitante"], 6, walk(3));
    expect(frames).toEqual(Array(6).fill("Visitante"));
    expect(
      stageFrames(["Ana G.", "Ana G.", "Ana G."], 4, walk(4)),
    ).not.toContain("");
  });

  it("still alternates when only some names repeat", () => {
    const frames = stageFrames(["Ana G.", "Ana G.", "Beto P."], 30, walk(7));
    for (const [i, frame] of frames.entries()) {
      if (i > 0) expect(frame).not.toBe(frames[i - 1]);
    }
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

// The same rule as the SQL that freezes the winner's name at the draw:
// coalesce(nullif(trim(display_name), ''), full_name).
describe("publicNameOf", () => {
  it("prefers the display name", () => {
    expect(
      publicNameOf({ display_name: "Ani Paz", full_name: "Ana García" }),
    ).toBe("Ani P.");
  });

  it("falls back to the full name when the display name is blank", () => {
    expect(publicNameOf({ display_name: "   ", full_name: "Ana García" })).toBe(
      "Ana G.",
    );
    expect(publicNameOf({ display_name: "", full_name: "Ana García" })).toBe(
      "Ana G.",
    );
    expect(publicNameOf({ display_name: null, full_name: "Ana García" })).toBe(
      "Ana G.",
    );
  });

  it("is Visitante without a profile or a name", () => {
    expect(publicNameOf(null)).toBe("Visitante");
    expect(publicNameOf({ display_name: null, full_name: null })).toBe(
      "Visitante",
    );
  });
});

describe("chunked", () => {
  it("splits in pieces of at most the size, in order", () => {
    expect(chunked([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("keeps a short list whole and an empty one empty", () => {
    expect(chunked([1, 2], 100)).toEqual([[1, 2]]);
    expect(chunked([], 100)).toEqual([]);
  });

  it("covers every item exactly once", () => {
    const ids = Array.from({ length: 250 }, (_, i) => i);
    const pieces = chunked(ids, 100);
    expect(pieces.map((p) => p.length)).toEqual([100, 100, 50]);
    expect(pieces.flat()).toEqual(ids);
  });
});

describe("stageFrames with people", () => {
  it("tells two people with the same name apart", () => {
    const lucias = [
      { name: "Lucía F.", claims: 2 },
      { name: "Lucía F.", claims: 3 },
    ];
    const frames = stageFrames(lucias, STAGE_FRAMES);
    for (const [i, frame] of frames.entries()) {
      expect(frame).not.toBe(frames[i - 1]);
    }
  });
});
