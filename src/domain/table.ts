/** Rows per page in the panel's tables. */
export const PAGE_SIZE = 25;

export type SortDir = "asc" | "desc";

export type TableQuery<K extends string> = {
  orden: K;
  dir: SortDir;
  pag: number;
};

type Param = string | string[] | undefined;

/**
 * Reads a table's sort and page from the URL (?orden=…&dir=…&pag=…). Anything
 * unknown or malformed falls back to the default, never to an error.
 */
export function readTableQuery<K extends string>(
  params: { orden?: Param; dir?: Param; pag?: Param },
  keys: readonly K[],
  fallback: { orden: K; dir: SortDir },
): TableQuery<K> {
  const orden = keys.find((k) => k === params.orden) ?? fallback.orden;
  const dir =
    params.dir === "asc" || params.dir === "desc"
      ? params.dir
      : orden === fallback.orden
        ? fallback.dir
        : "asc";
  const pag = Number(params.pag);
  return { orden, dir, pag: Number.isInteger(pag) && pag > 1 ? pag : 1 };
}

const collator = new Intl.Collator("es-AR", { numeric: true });

/**
 * Sorts rows by one value and cuts the requested page. The sort is stable, so
 * ties keep the order they came in. A page past the end lands on the last one.
 */
export function sortAndPage<T>(
  rows: readonly T[],
  value: (row: T) => string | number,
  { dir, pag }: { dir: SortDir; pag: number },
  size = PAGE_SIZE,
) {
  const sign = dir === "asc" ? 1 : -1;
  const sorted = rows.toSorted((a, b) => {
    const x = value(a);
    const y = value(b);
    return (
      sign *
      (typeof x === "number" && typeof y === "number"
        ? x - y
        : collator.compare(String(x), String(y)))
    );
  });
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const page = Math.min(pag, pageCount);
  return {
    rows: sorted.slice((page - 1) * size, page * size),
    page,
    pageCount,
  };
}
