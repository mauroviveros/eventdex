import { readTableQuery, sortAndPage } from "@/domain/table";
import type { listEventVisitors } from "@/lib/data/claims";
import { VISITOR_SORTS } from "./query";
import { VisitorsTable } from "./VisitorsTable";

type Params = Record<string, string | string[] | undefined>;

const KEYS = Object.keys(VISITOR_SORTS) as (keyof typeof VISITOR_SORTS)[];

/**
 * Who registered in the event (their first medal), how many medals each has,
 * and the block: a blocked visitor keeps their medals but claims no more.
 */
export function VisitorsTab({
  org,
  support,
  timezone,
  visitors,
  params,
}: {
  org: string;
  support: boolean;
  timezone: string;
  visitors: Awaited<ReturnType<typeof listEventVisitors>>;
  params: Params;
}) {
  const blocked = visitors.filter((v) => v.blocked_at).length;
  const query = readTableQuery(params, KEYS, { orden: "desde", dir: "desc" });
  // shortcut: sorts in memory, move to a view with the count and .range() past ~5000 visitors per event
  const { rows, page, pageCount } = sortAndPage(
    visitors,
    (v) =>
      ({ nombre: v.name, medallas: v.medals, desde: v.created_at })[
        query.orden
      ],
    query,
  );

  return (
    <>
      <p className="max-w-prose">
        Se registran con su primera medalla. Si bloqueás a alguien, conserva lo
        que juntó pero no suma más.
      </p>

      {visitors.length === 0 ? (
        <div className="grid max-w-prose gap-2 border-2 border-dashed border-lcd-2 px-6 py-8">
          <p className="font-display text-px-2">Todavía no hay visitantes</p>
          <p>Aparecen acá cuando escanean el primer QR durante el evento.</p>
        </div>
      ) : (
        <section aria-labelledby="lista" className="grid min-w-0 gap-4">
          <h2 id="lista" className="text-px-2">
            {visitors.length === 1
              ? "1 visitante"
              : `${visitors.length.toLocaleString("es-AR")} visitantes`}
            {blocked > 0 &&
              ` · ${blocked} ${blocked === 1 ? "bloqueado" : "bloqueados"}`}
          </h2>
          <VisitorsTable
            org={org}
            support={support}
            timezone={timezone}
            rows={rows}
            sort={query}
            page={page}
            pageCount={pageCount}
          />
        </section>
      )}
    </>
  );
}
