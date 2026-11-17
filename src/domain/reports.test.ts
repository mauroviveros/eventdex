import { describe, expect, it } from "vitest";
import {
  leftOut,
  placeLabel,
  reportCut,
  shareOfAudience,
  unusedSlots,
  versusAverage,
} from "./reports";

describe("shareOfAudience", () => {
  it("is the part of the visitors who reached the stand", () => {
    expect(shareOfAudience(3, 4)).toBe(0.75);
  });

  it("is null with nobody to divide by", () => {
    expect(shareOfAudience(0, 0)).toBeNull();
  });
});

describe("versusAverage", () => {
  it("is 1 on the average and above it for a stand that beat it", () => {
    expect(versusAverage(5, 5)).toBe(1);
    expect(versusAverage(6, 4)).toBe(1.5);
  });

  it("is null when no stand scored", () => {
    expect(versusAverage(0, 0)).toBeNull();
  });
});

describe("placeLabel", () => {
  it("names the place and how many stands there are", () => {
    expect(placeLabel(3, 12)).toBe("3 de 12");
  });

  it("is null for an inactive stand or an event without stands", () => {
    expect(placeLabel(null, 12)).toBeNull();
    expect(placeLabel(1, 0)).toBeNull();
  });
});

describe("prizes", () => {
  it("counts the slots nobody took, and none for a prize without a cap", () => {
    expect(unusedSlots({ slots: 5, winners: 2, reached: 2 })).toBe(3);
    expect(unusedSlots({ slots: 1, winners: 1, reached: 4 })).toBe(0);
    expect(unusedSlots({ slots: null, winners: 9, reached: 9 })).toBeNull();
  });

  it("counts who reached a prize and did not get it, never below zero", () => {
    expect(leftOut({ slots: 1, winners: 1, reached: 4 })).toBe(3);
    expect(leftOut({ slots: null, winners: 3, reached: 3 })).toBe(0);
    expect(leftOut({ slots: 5, winners: 3, reached: 2 })).toBe(0);
  });
});

describe("reportCut", () => {
  const schedules = [
    { starts_at: "2026-11-14T13:00:00Z", ends_at: "2026-11-14T23:00:00Z" },
  ];
  const event = {
    status: "published",
    timezone: "America/Argentina/Buenos_Aires",
    schedules,
  };

  it("says when the data was taken in the event's zone, on 24 hours", () => {
    const { at } = reportCut(event, new Date("2026-11-15T01:30:00Z"));
    // The joiner between date and time (", " or " a las ") depends on the ICU version.
    expect(at).toMatch(/^14 de noviembre.*22:30$/);
  });

  it("is partial while the event runs or has not started, and final after it", () => {
    expect(reportCut(event, new Date("2026-11-14T18:00:00Z")).partial).toBe(
      true,
    );
    expect(reportCut(event, new Date("2026-11-13T18:00:00Z")).partial).toBe(
      true,
    );
    expect(reportCut(event, new Date("2026-11-15T01:00:00Z")).partial).toBe(
      false,
    );
  });
});
