import { describe, expect, it } from "vitest";
import { buildHistory, type HistoryEdition } from "./history";

let n = 0;
const edition = (over: Partial<HistoryEdition> = {}): HistoryEdition => ({
  id: `e${++n}`,
  title: "Expo",
  editionLabel: null,
  startsAt: "2026-04-01T12:00:00Z",
  came: true,
  medals: 3,
  total: 5,
  wins: 0,
  ...over,
});

const stamps = (editions: HistoryEdition[]) =>
  buildHistory(editions).stamps.map((s) => s.id);

describe("buildHistory", () => {
  it("is empty for a visitor who came to nothing", () => {
    const h = buildHistory([edition({ came: false })]);
    expect(h.played).toEqual([]);
    expect(h.totals).toEqual({ events: 0, medals: 0, wins: 0 });
    expect(h.since).toBeNull();
    expect(h.stamps).toEqual([]);
  });

  it("lists what the visitor played, latest first, and adds it up", () => {
    const h = buildHistory([
      edition({ id: "a", startsAt: "2025-04-01T12:00:00Z", medals: 2 }),
      edition({
        id: "b",
        startsAt: "2026-04-01T12:00:00Z",
        medals: 4,
        wins: 1,
      }),
      edition({ id: "c", startsAt: "2026-09-01T12:00:00Z", came: false }),
    ]);
    expect(h.played.map((e) => e.id)).toEqual(["b", "a"]);
    expect(h.totals).toEqual({ events: 2, medals: 6, wins: 1 });
    expect(h.since).toBe("2025-04-01T12:00:00Z");
  });

  it("counts the editions of a series by title: came to 3 of 4", () => {
    const h = buildHistory([
      edition({ title: "Expo", startsAt: "2023-04-01T12:00:00Z" }),
      edition({ title: "Expo", startsAt: "2024-04-01T12:00:00Z", came: false }),
      edition({ title: "Expo", startsAt: "2025-04-01T12:00:00Z" }),
      edition({ title: "Expo", startsAt: "2026-04-01T12:00:00Z" }),
      edition({
        title: "Otra feria",
        startsAt: "2026-05-01T12:00:00Z",
        came: false,
      }),
    ]);
    expect(h.series).toEqual([{ title: "Expo", came: 3, of: 4 }]);
  });

  describe("stamps", () => {
    it("gives the first-edition stamp only in a series that went on", () => {
      const first = edition({ startsAt: "2025-04-01T12:00:00Z" });
      const second = edition({ startsAt: "2026-04-01T12:00:00Z", came: false });
      expect(stamps([first, second])).toContain("primera-edicion");
      expect(stamps([first])).not.toContain("primera-edicion");
      expect(
        stamps([
          { ...first, came: false },
          { ...second, came: true },
        ]),
      ).not.toContain("primera-edicion");
    });

    it("gives three-in-a-row only without a gap in the series", () => {
      const year = (y: number, came = true) =>
        edition({ startsAt: `${y}-04-01T12:00:00Z`, came });
      expect(stamps([year(2024), year(2025), year(2026)])).toContain(
        "tres-seguidas",
      );
      expect(
        stamps([year(2023), year(2024, false), year(2025), year(2026)]),
      ).not.toContain("tres-seguidas");
    });

    it("gives the full-collection stamp for every medal of an event", () => {
      expect(stamps([edition({ medals: 5, total: 5 })])).toContain(
        "coleccion-completa",
      );
      expect(stamps([edition({ medals: 0, total: 0 })])).not.toContain(
        "coleccion-completa",
      );
      expect(stamps([edition({ medals: 4, total: 5 })])).not.toContain(
        "coleccion-completa",
      );
    });

    it("gives the winner stamp after any raffle won", () => {
      expect(stamps([edition({ wins: 1 })])).toContain("ganador");
      expect(stamps([edition()])).not.toContain("ganador");
    });
  });
});
