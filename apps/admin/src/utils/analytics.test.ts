import { describe, expect, it } from "vitest";
import { scansPerDay } from "./analytics";

describe("scansPerDay", () => {
  const tz = "America/Argentina/Buenos_Aires";

  it("devuelve vacío sin escaneos", () => {
    expect(scansPerDay([], tz)).toEqual([]);
  });

  it("agrupa por día en el timezone del evento", () => {
    // 01:30 UTC del 13 todavía es 12 a las 22:30 en Buenos Aires (UTC-3).
    const rows = [
      { collected_at: "2027-09-12T15:00:00+00:00" },
      { collected_at: "2027-09-13T01:30:00+00:00" },
      { collected_at: "2027-09-13T15:00:00+00:00" },
    ];
    expect(scansPerDay(rows, tz)).toEqual([
      { day: "2027-09-12", count: 2 },
      { day: "2027-09-13", count: 1 },
    ]);
  });

  it("rellena los días sin escaneos entre el primero y el último", () => {
    const rows = [
      { collected_at: "2027-09-12T15:00:00+00:00" },
      { collected_at: "2027-09-15T15:00:00+00:00" },
    ];
    expect(scansPerDay(rows, tz)).toEqual([
      { day: "2027-09-12", count: 1 },
      { day: "2027-09-13", count: 0 },
      { day: "2027-09-14", count: 0 },
      { day: "2027-09-15", count: 1 },
    ]);
  });
});
