import { describe, expect, it } from "vitest";
import { readTableQuery, sortAndPage } from "./table";

const SORTS = { nombre: "asc", medallas: "desc" } as const;

describe("readTableQuery", () => {
  it("falls back on empty or unknown params", () => {
    expect(readTableQuery({}, SORTS, "medallas")).toEqual({
      orden: "medallas",
      dir: "desc",
      pag: 1,
    });
    expect(
      readTableQuery({ orden: "x", dir: "y", pag: "-3" }, SORTS, "medallas"),
    ).toEqual({ orden: "medallas", dir: "desc", pag: 1 });
    expect(readTableQuery({ pag: "2.5" }, SORTS, "medallas").pag).toBe(1);
  });

  it("reads a valid query, each column with its own default direction", () => {
    expect(
      readTableQuery({ orden: "nombre", pag: "3" }, SORTS, "medallas"),
    ).toEqual({ orden: "nombre", dir: "asc", pag: 3 });
    expect(
      readTableQuery({ orden: "nombre", dir: "desc" }, SORTS, "medallas").dir,
    ).toBe("desc");
  });
});

describe("sortAndPage", () => {
  const rows = [
    { name: "bruno", n: 2 },
    { name: "Ana", n: 10 },
    { name: "Álvaro", n: 2 },
    { name: "carla", n: 1 },
  ];

  it("sorts numbers numerically and text the es-AR way", () => {
    expect(
      sortAndPage(rows, (r) => r.n, { dir: "desc", pag: 1 }).rows.map(
        (r) => r.n,
      ),
    ).toEqual([10, 2, 2, 1]);
    expect(
      sortAndPage(rows, (r) => r.name, { dir: "asc", pag: 1 }).rows.map(
        (r) => r.name,
      ),
    ).toEqual(["Álvaro", "Ana", "bruno", "carla"]);
  });

  it("keeps ties in their original order", () => {
    expect(
      sortAndPage(rows, (r) => r.n, { dir: "asc", pag: 1 }).rows.map(
        (r) => r.name,
      ),
    ).toEqual(["carla", "bruno", "Álvaro", "Ana"]);
  });

  it("cuts pages and clamps past the end", () => {
    const by = (r: { n: number }) => r.n;
    expect(sortAndPage(rows, by, { dir: "asc", pag: 2 }, 3)).toMatchObject({
      page: 2,
      pageCount: 2,
      rows: [{ name: "Ana" }],
    });
    expect(sortAndPage(rows, by, { dir: "asc", pag: 9 }, 3).page).toBe(2);
    expect(sortAndPage([], by, { dir: "asc", pag: 1 })).toEqual({
      rows: [],
      page: 1,
      pageCount: 1,
    });
  });
});
