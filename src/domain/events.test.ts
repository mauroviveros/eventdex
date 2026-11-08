import { describe, expect, it } from "vitest";
import {
  countdownState,
  eventPhase,
  formatEventDates,
  formatScheduleTimes,
  isTimeZone,
  localToInstant,
} from "./events";

const BA = "America/Argentina/Buenos_Aires";
const now = new Date("2026-11-14T15:00:00Z"); // sáb 14 nov, 12:00 en Buenos Aires

const day = (start: string, end: string) => ({
  starts_at: start,
  ends_at: end,
});

describe("eventPhase", () => {
  it("is finished when the last schedule ended", () => {
    expect(
      eventPhase(
        "published",
        [day("2026-11-01T13:00:00Z", "2026-11-01T21:00:00Z")],
        now,
      ),
    ).toBe("finalizado");
  });

  it("is live during a schedule and between two of them", () => {
    const during = [day("2026-11-14T13:00:00Z", "2026-11-14T21:00:00Z")];
    expect(eventPhase("published", during, now)).toBe("en-curso");
    const between = [
      day("2026-11-13T13:00:00Z", "2026-11-13T21:00:00Z"),
      day("2026-11-15T13:00:00Z", "2026-11-15T21:00:00Z"),
    ];
    expect(eventPhase("published", between, now)).toBe("en-curso");
  });

  it("is upcoming before the first schedule", () => {
    expect(
      eventPhase(
        "published",
        [day("2026-11-20T13:00:00Z", "2026-11-20T21:00:00Z")],
        now,
      ),
    ).toBe("proximo");
  });

  it("has no date without schedules", () => {
    expect(eventPhase("published", [], now)).toBe("sin-fecha");
  });

  it("is a draft until published, whatever its dates", () => {
    expect(
      eventPhase(
        "draft",
        [day("2026-11-14T13:00:00Z", "2026-11-14T21:00:00Z")],
        now,
      ),
    ).toBe("borrador");
  });

  it("counts the exact start and end as live", () => {
    const s = [day("2026-11-14T15:00:00Z", "2026-11-14T21:00:00Z")];
    expect(eventPhase("published", s, now)).toBe("en-curso");
    const e = [day("2026-11-14T13:00:00Z", "2026-11-14T15:00:00Z")];
    expect(eventPhase("published", e, now)).toBe("en-curso");
  });
});

describe("formatEventDates", () => {
  it("shows one day, a range, and the year only outside the current one", () => {
    expect(
      formatEventDates(
        [day("2026-11-14T13:00:00Z", "2026-11-14T21:00:00Z")],
        BA,
        now,
      ),
    ).toBe("sáb, 14 nov");
    expect(
      formatEventDates(
        [
          day("2026-11-14T13:00:00Z", "2026-11-14T21:00:00Z"),
          day("2026-11-15T13:00:00Z", "2026-11-15T21:00:00Z"),
        ],
        BA,
        now,
      ),
    ).toBe("sáb 14 al dom 15 de nov");
    expect(
      formatEventDates(
        [day("2027-03-06T13:00:00Z", "2027-03-06T21:00:00Z")],
        BA,
        now,
      ),
    ).toContain("2027");
  });

  it("uses the event's zone, not the server's", () => {
    // 01:00 UTC on the 15th is still the 14th in Buenos Aires.
    expect(
      formatEventDates(
        [day("2026-11-14T22:00:00Z", "2026-11-15T01:00:00Z")],
        BA,
        now,
      ),
    ).toBe("sáb, 14 nov");
  });

  it("is null without schedules", () => {
    expect(formatEventDates([], BA, now)).toBeNull();
  });
});

describe("formatScheduleTimes", () => {
  it("shows 24-hour times in the event's zone", () => {
    expect(
      formatScheduleTimes(
        day("2026-11-14T13:00:00Z", "2026-11-14T21:00:00Z"),
        BA,
      ),
    ).toMatch(/^10:00\s*–\s*18:00$/);
  });
});

describe("localToInstant", () => {
  it("reads the form's wall-clock time in the event's zone", () => {
    expect(localToInstant("2026-11-14T10:00", BA).toISOString()).toBe(
      "2026-11-14T13:00:00.000Z",
    );
  });

  it("follows daylight saving time", () => {
    const madrid = "Europe/Madrid";
    expect(localToInstant("2026-01-10T10:00", madrid).toISOString()).toBe(
      "2026-01-10T09:00:00.000Z",
    );
    expect(localToInstant("2026-07-10T10:00", madrid).toISOString()).toBe(
      "2026-07-10T08:00:00.000Z",
    );
  });

  it("rejects anything that isn't a local date-time", () => {
    expect(() => localToInstant("14/11/2026 10:00", BA)).toThrow(RangeError);
  });
});

describe("isTimeZone", () => {
  it("accepts IANA zones and rejects the rest", () => {
    expect(isTimeZone(BA)).toBe(true);
    expect(isTimeZone("Mars/Olympus")).toBe(false);
  });
});

describe("countdownState", () => {
  const two = [
    day("2026-11-14T13:00:00Z", "2026-11-14T21:00:00Z"),
    day("2026-11-15T13:00:00Z", "2026-11-15T21:00:00Z"),
  ];

  it("counts down to the first schedule", () => {
    expect(countdownState(two, BA, new Date("2026-11-12T10:30:00Z"))).toEqual({
      kind: "faltan",
      days: 2,
      hours: 2,
      minutes: 30,
    });
  });

  it("says when the running schedule ends, in the event's zone", () => {
    expect(countdownState(two, BA, now)).toEqual({
      kind: "en-curso",
      endsAt: "18:00",
    });
  });

  it("counts down to the next day between two schedules", () => {
    expect(countdownState(two, BA, new Date("2026-11-15T03:00:00Z"))).toEqual({
      kind: "faltan",
      days: 0,
      hours: 10,
      minutes: 0,
    });
  });

  it("is finished after the last schedule, or without schedules", () => {
    expect(countdownState(two, BA, new Date("2026-11-16T00:00:00Z"))).toEqual({
      kind: "finalizado",
    });
    expect(countdownState([], BA, now)).toEqual({ kind: "finalizado" });
  });
});
