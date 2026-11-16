import { describe, expect, it } from "vitest";
import { awardNeeded, awardRequirement, awardStanding } from "./awards";

describe("awardNeeded", () => {
  it("takes a count as it is", () => {
    expect(awardNeeded({ kind: "count", threshold: 3 }, 10)).toBe(3);
  });

  it.each([
    [50, 4, 2],
    [50, 5, 3],
    [100, 7, 7],
    [1, 10, 1],
    [10, 0, 1],
  ])(
    "%i %% of %i stands asks for %i, rounding up and never zero",
    (threshold, total, needed) => {
      expect(awardNeeded({ kind: "percent", threshold }, total)).toBe(needed);
    },
  );
});

describe("awardStanding", () => {
  const first5 = {
    kind: "percent",
    threshold: 100,
    slots: 5,
    taken: 3,
  } as const;

  it("counts what is missing and the places left", () => {
    expect(awardStanding(first5, 2, 4)).toEqual({
      needed: 4,
      missing: 2,
      reached: false,
      slotsLeft: 2,
      closed: false,
      unreachable: false,
    });
  });

  it("is closed when the cap is full, and reached still says so", () => {
    const s = awardStanding({ ...first5, taken: 5 }, 4, 4);
    expect(s).toMatchObject({ reached: true, slotsLeft: 0, closed: true });
  });

  it("has no places to count without a cap", () => {
    const s = awardStanding(
      { kind: "count", threshold: 2, slots: null, taken: 9 },
      0,
      4,
    );
    expect(s).toMatchObject({ slotsLeft: null, closed: false });
  });

  it("flags a count the event cannot reach", () => {
    const s = awardStanding(
      { kind: "count", threshold: 9, slots: null, taken: 0 },
      0,
      4,
    );
    expect(s.unreachable).toBe(true);
  });
});

describe("awardRequirement", () => {
  it("names all, one and many", () => {
    expect(awardRequirement({ kind: "percent", threshold: 100 }, 6)).toBe(
      "todas las medallas",
    );
    expect(awardRequirement({ kind: "count", threshold: 1 }, 6)).toBe(
      "1 medalla",
    );
    expect(awardRequirement({ kind: "percent", threshold: 50 }, 6)).toBe(
      "3 medallas",
    );
  });
});
