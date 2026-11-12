import { describe, expect, it } from "vitest";
import {
  activeEvent,
  countdownState,
  eventPhase,
  eventSlug,
  formatEventDates,
  formatMoment,
  formatScheduleTimes,
  instantToLocal,
  isTimeZone,
  localToInstant,
  sortForPanel,
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

describe("formatMoment", () => {
  it("shows an instant in the event's time zone", () => {
    expect(formatMoment("2026-11-14T18:32:00Z", BA)).toBe("sáb, 14 nov, 15:32");
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

describe("instantToLocal", () => {
  it("is the form's wall-clock time in the event's zone, and round-trips", () => {
    expect(instantToLocal("2026-11-14T13:00:00Z", BA)).toBe("2026-11-14T10:00");
    expect(instantToLocal("2026-07-10T08:00:00+00:00", "Europe/Madrid")).toBe(
      "2026-07-10T10:00",
    );
    expect(
      instantToLocal(localToInstant("2026-11-14T23:30", BA).toISOString(), BA),
    ).toBe("2026-11-14T23:30");
  });
});

describe("eventSlug", () => {
  it("joins name and edition without accents or symbols", () => {
    expect(eventSlug("Expo Ubbe", "2026")).toBe("expo-ubbe-2026");
    expect(eventSlug("  Feria Navideña ¡Única!  ", null)).toBe(
      "feria-navidena-unica",
    );
  });

  it("always matches the address format, even from odd names", () => {
    const SLUG = /^[a-z0-9][a-z0-9-]{1,62}$/;
    for (const slug of [
      eventSlug("!!", null),
      eventSlug("X", null),
      eventSlug("a".repeat(160), "Noviembre"),
      eventSlug("Expo — ", "2026 ·"),
    ])
      expect(slug).toMatch(SLUG);
  });
});

describe("sortForPanel", () => {
  const ev = (
    name: string,
    phase: Parameters<typeof sortForPanel>[0][number]["phase"],
    start?: string,
  ) => ({
    name,
    phase,
    schedules: start ? [day(start, start)] : [],
  });

  it("puts live first, then the next ones by date, drafts, undated and the finished latest first", () => {
    const sorted = sortForPanel([
      ev("viejo", "finalizado", "2026-01-10T12:00:00Z"),
      ev("borrador", "borrador"),
      ev("lejos", "proximo", "2026-12-20T12:00:00Z"),
      ev("ahora", "en-curso", "2026-11-14T12:00:00Z"),
      ev("reciente", "finalizado", "2026-10-10T12:00:00Z"),
      ev("sin fecha", "sin-fecha"),
      ev("cerca", "proximo", "2026-11-20T12:00:00Z"),
    ]);
    expect(sorted.map((e) => e.name)).toEqual([
      "ahora",
      "cerca",
      "lejos",
      "borrador",
      "sin fecha",
      "reciente",
      "viejo",
    ]);
  });

  it("keeps drafts in the order they came", () => {
    const sorted = sortForPanel([ev("b", "borrador"), ev("a", "borrador")]);
    expect(sorted.map((e) => e.name)).toEqual(["b", "a"]);
  });
});

describe("activeEvent", () => {
  const ev = (
    phase: Parameters<typeof activeEvent>[0][number]["phase"],
    start = "2026-11-20T12:00:00Z",
  ) => ({ phase, schedules: [day(start, start)] });

  it("is the event in course, over the next one", () => {
    const live = ev("en-curso");
    expect(activeEvent([ev("proximo"), live])).toBe(live);
  });

  it("is the soonest upcoming event when none is in course", () => {
    const soon = ev("proximo", "2026-11-16T12:00:00Z");
    expect(activeEvent([ev("proximo"), soon, ev("finalizado")])).toBe(soon);
  });

  it("is none with only drafts and finished events", () => {
    expect(activeEvent([ev("borrador"), ev("finalizado")])).toBeNull();
    expect(activeEvent([])).toBeNull();
  });
});
