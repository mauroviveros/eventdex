/** Rows per page in the panel's tables. */
const PAGE_SIZE = 25;

export type SortDir = "asc" | "desc";

type TableQuery<K extends string> = {
  orden: K;
  dir: SortDir;
  pag: number;
};

type Param = string | string[] | undefined;

/** URL params as a page receives them. */
export type SearchParams = Record<string, Param>;

/**
 * Reads a table's sort and page from the URL (?orden=…&dir=…&pag=…). `sorts`
 * maps each sortable column to the direction of its first click, which is
 * also its direction when the URL names it without one. Anything unknown or
 * malformed falls back to the default, never to an error.
 */
export function readTableQuery<K extends string>(
  params: SearchParams,
  sorts: Record<K, SortDir>,
  fallback: K,
): TableQuery<K> {
  const keys = Object.keys(sorts) as K[];
  const orden = keys.find((k) => k === params.orden) ?? fallback;
  const dir =
    params.dir === "asc" || params.dir === "desc" ? params.dir : sorts[orden];
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
