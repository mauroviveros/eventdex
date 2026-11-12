/**
 * A ruled strip of an event's figures, like the cells of an LCD readout: four
 * in a row from `sm`, two by two on a phone. Values come already formatted.
 */
export function StatStrip({
  cells,
}: {
  cells: [label: string, value: string][];
}) {
  return (
    <dl className="grid grid-cols-2 border-2 border-lcd-3 sm:grid-cols-4">
      {cells.map(([label, value], i) => (
        <div
          key={label}
          // Rules follow the grid: right between columns, top on the phone's second row.
          className={`grid gap-1 px-4 py-3 ${i % 2 === 0 ? "border-r-2 border-lcd-3" : ""} ${
            i > 1 ? "border-t-2 border-lcd-3 sm:border-t-0" : ""
          } ${i < cells.length - 1 ? "sm:border-r-2" : ""}`}
        >
          <dt className="font-display text-px-1 text-muted-foreground">
            {label}
          </dt>
          <dd className="font-display text-px-3 tabular-nums">{value}</dd>
        </div>
      ))}
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
