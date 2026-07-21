import { describe, expect, it } from "vitest";
import {
  countBy,
  formatDateRange,
  localToUtcIso,
  scheduleRange,
  utcIsoToLocal,
} from "./schedule";

describe("scheduleRange", () => {
  it("devuelve null sin horarios", () => {
    expect(scheduleRange([])).toBeNull();
  });

  it("toma el inicio más temprano y el fin más tardío", () => {
    const range = scheduleRange([
      {
        start_datetime: "2026-09-13T10:00:00Z",
        end_datetime: "2026-09-13T20:00:00Z",
      },
      {
        start_datetime: "2026-09-12T10:00:00Z",
        end_datetime: "2026-09-12T20:00:00Z",
      },
      {
        start_datetime: "2026-09-14T10:00:00Z",
        end_datetime: "2026-09-14T18:00:00Z",
      },
    ]);
    expect(range).toEqual({
      start: "2026-09-12T10:00:00Z",
      end: "2026-09-14T18:00:00Z",
    });
  });
});

describe("formatDateRange", () => {
  const tz = "America/Argentina/Buenos_Aires";

  it("colapsa un solo día", () => {
    expect(
      formatDateRange(
        "2026-09-12T10:00:00-03:00",
        "2026-09-12T20:00:00-03:00",
        tz,
      ),
    ).toBe("12 sept 2026");
  });

  it("colapsa mes compartido", () => {
    expect(
      formatDateRange(
        "2026-09-12T10:00:00-03:00",
        "2026-09-14T20:00:00-03:00",
        tz,
      ),
    ).toBe("12–14 sept 2026");
  });

  it("muestra ambos meses cuando cruza de mes", () => {
    expect(
      formatDateRange(
        "2026-09-30T10:00:00-03:00",
        "2026-10-02T20:00:00-03:00",
        tz,
      ),
    ).toBe("30 sept – 2 oct 2026");
  });

  it("respeta el timezone del evento", () => {
    // 23:30 UTC del 12 ya es 13 en Tokio.
    expect(
      formatDateRange(
        "2026-09-12T23:30:00Z",
        "2026-09-12T23:45:00Z",
        "Asia/Tokyo",
      ),
    ).toBe("13 sept 2026");
  });
});

describe("localToUtcIso / utcIsoToLocal", () => {
  const tz = "America/Argentina/Buenos_Aires";

  it("interpreta el datetime-local en el timezone del evento", () => {
    // 10:00 en Buenos Aires (UTC-3) son las 13:00 UTC.
    expect(localToUtcIso("2027-09-12T10:00", tz)).toBe(
      "2027-09-12T13:00:00.000Z",
    );
  });

  it("devuelve null si el valor no parsea", () => {
    expect(localToUtcIso("no-es-una-fecha", tz)).toBeNull();
  });

  it("es inverso de utcIsoToLocal", () => {
    const local = "2027-09-12T10:00";
    const utc = localToUtcIso(local, tz);
    expect(utc && utcIsoToLocal(utc, tz)).toBe(local);
  });
});

describe("countBy", () => {
  it("agrupa y cuenta por clave", () => {
    const rows = [{ id: "a" }, { id: "b" }, { id: "a" }];
    const counts = countBy(rows, (row) => row.id);
    expect(counts.get("a")).toBe(2);
    expect(counts.get("b")).toBe(1);
    expect(counts.get("c")).toBeUndefined();
  });
});
