import Link from "next/link";

type Cell = [label: string, value: string, caption?: string, href?: string];

/**
 * A ruled strip of figures, like the cells of an LCD readout: one row from
 * `sm`, two by two on a phone (an odd last cell takes the whole row). Values
 * come already formatted; a caption says what the figure means. With an
 * href the whole cell is a link to where the figure comes from.
 */
export function StatStrip({ cells }: { cells: Cell[] }) {
  const n = cells.length;
  return (
    <dl className="grid grid-cols-2 border-2 border-lcd-3 sm:grid-flow-col sm:grid-cols-none sm:auto-cols-fr">
      {cells.map(([label, value, caption, href], i) => {
        const wide = n % 2 === 1 && i === n - 1;
        return (
          <div
            key={label}
            // Rules follow the grid: between columns, and on top of the phone's later rows.
            className={[
              "relative grid content-start gap-1 border-lcd-3 px-4 py-3",
              href ? "has-[a:hover]:bg-lcd-1" : "",
              wide
                ? "max-sm:col-span-2"
                : i % 2 === 0
                  ? "max-sm:border-r-2"
                  : "",
              i > 1 ? "max-sm:border-t-2" : "",
              i < n - 1 ? "sm:border-r-2" : "",
            ].join(" ")}
          >
            <dt className="font-display text-px-1 text-muted-foreground">
              {href ? (
                // The link's box covers the cell: the figure and its caption take the click too.
                <Link href={href} className="after:absolute after:inset-0">
                  {label}
                </Link>
              ) : (
                label
              )}
            </dt>
            <dd className="font-display text-px-3 tabular-nums">{value}</dd>
            {caption && (
              <dd className="text-sm text-muted-foreground">{caption}</dd>
            )}
          </div>
        );
      })}
    </dl>
  );
}

const perVisitorFormat = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 1,
});

/** Stands, visitors, medals and medals per visitor, the way the panel shows them. */
export function eventCells(stats: {
  stands: number;
  visitors: number;
  medals: number;
}): [string, string][] {
  const { stands, visitors, medals } = stats;
  return [
    ["Stands", stands.toLocaleString("es-AR")],
    ["Visitantes", visitors.toLocaleString("es-AR")],
    ["Medallas", medals.toLocaleString("es-AR")],
    [
      "Por visitante",
      visitors ? perVisitorFormat.format(medals / visitors) : "–",
    ],
  ];
}
