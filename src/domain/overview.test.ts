import { describe, expect, it } from "vitest";
import {
  activityCursor,
  dataState,
  FEW_VISITORS,
  funnel,
  hoursBySchedule,
  isActivityKind,
  medalsPerVisitor,
  parseActivityCursor,
} from "./overview";

describe("hoursBySchedule", () => {
  const day = {
    starts_at: "2026-11-14T13:00:00Z",
    ends_at: "2026-11-14T16:00:00Z",
  };

  it("gives every hour of the schedule, with zero where nothing happened", () => {
    const [only] = hoursBySchedule(
      [{ hour: "2026-11-14T14:00:00Z", medals: 3, newcomers: 1 }],
      [day],
    );
    expect(only?.hours).toEqual([
      { hour: "2026-11-14T13:00:00.000Z", medals: 0, newcomers: 0 },
      { hour: "2026-11-14T14:00:00.000Z", medals: 3, newcomers: 1 },
      { hour: "2026-11-14T15:00:00.000Z", medals: 0, newcomers: 0 },
    ]);
  });

  it("starts at the hour the schedule starts in, even off the hour", () => {
    const [only] = hoursBySchedule(
      [],
      [{ starts_at: "2026-11-14T13:30:00Z", ends_at: "2026-11-14T14:30:00Z" }],
    );
    expect(only?.hours.map((h) => h.hour)).toEqual([
      "2026-11-14T13:00:00.000Z",
      "2026-11-14T14:00:00.000Z",
    ]);
  });

  it("keeps each schedule apart and in order, without the night between them", () => {
    const next = {
      starts_at: "2026-11-15T13:00:00Z",
      ends_at: "2026-11-15T14:00:00Z",
    };
    const days = hoursBySchedule([], [next, day]);
    expect(days.map((d) => [d.startsAt, d.hours.length])).toEqual([
      [day.starts_at, 3],
      [next.starts_at, 1],
    ]);
  });

  it("gives nothing without schedules", () => {
    expect(
      hoursBySchedule([{ hour: day.starts_at, medals: 1, newcomers: 1 }], []),
    ).toEqual([]);
  });
});

describe("funnel", () => {
  it("gives each step with its share of the registered", () => {
    expect(funnel({ visitors: 4, half: 2, complete: 1 })).toEqual([
      { step: "registrados", count: 4, share: 1 },
      { step: "mitad", count: 2, share: 0.5 },
      { step: "todas", count: 1, share: 0.25 },
    ]);
  });

  it("gives zero shares with nobody registered", () => {
    expect(
      funnel({ visitors: 0, half: 0, complete: 0 }).map((s) => s.share),
    ).toEqual([0, 0, 0]);
  });
});

describe("medalsPerVisitor", () => {
  it("divides the medals among the visitors, or gives null without visitors", () => {
    expect(medalsPerVisitor({ visitors: 4, medals: 10 })).toBe(2.5);
    expect(medalsPerVisitor({ visitors: 0, medals: 0 })).toBeNull();
  });
});

describe("dataState", () => {
  it("says empty, few or enough by the visitors", () => {
    expect(dataState(0)).toBe("vacio");
    expect(dataState(FEW_VISITORS - 1)).toBe("pocos");
    expect(dataState(FEW_VISITORS)).toBe("listo");
  });
});

describe("isActivityKind", () => {
  it("accepts the kinds the activity knows and nothing else", () => {
    expect(["medalla", "premio", "sorteo"].every(isActivityKind)).toBe(true);
    expect(isActivityKind("registro")).toBe(false);
  });
});

describe("activity cursor", () => {
  const row = {
    at: "2026-11-14T20:54:13.956196+00:00",
    id: "00000000-0000-0000-0000-00000000e105",
  };

  it("goes to the URL and back keeping the microseconds", () => {
    expect(parseActivityCursor(activityCursor(row))).toEqual(row);
  });

  it("takes back a + the URL turned into a space", () => {
    expect(
      parseActivityCursor(
        "2026-11-14T20:54:13.956196 00:00_00000000-0000-0000-0000-00000000e105",
      ),
    ).toEqual(row);
  });

  it("gives null for anything that is not a cursor, so the list starts over", () => {
    for (const bad of [
      undefined,
      ["x"],
      "",
      "basura",
      `${row.at}_no-es-un-id`,
      `ayer_${row.id}`,
      `_${row.id}`,
    ]) {
      expect(parseActivityCursor(bad)).toBeNull();
    }
  });
});
