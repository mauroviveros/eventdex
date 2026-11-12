"use client";

import { createColumnHelper } from "@tanstack/react-table";
import Link from "next/link";
import { useMemo } from "react";
import { DataTable, type features } from "@/components/admin/DataTable";
import { EventActions } from "@/components/admin/EventActions";
import { PhaseBadge } from "@/components/visitante/PhaseBadge";
import type { Phase } from "@/domain/events";

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  edition: string | null;
  phase: Phase;
  /** Already formatted in the event's time zone. */
  dates: string | null;
  venue: string | null;
  stats: { stands: number; visitors: number; medals: number };
  draft: boolean;
  /** Has a schedule: a draft can be published. */
  ready: boolean;
  publicUrl: string | null;
};

const helper = createColumnHelper<typeof features, EventRow>();
const count = (n: number) => (
  <span className="tabular-nums">{n.toLocaleString("es-AR")}</span>
);

/**
 * The org's events, one per row in the panel's order (sortForPanel), the name
 * as the way in and the ⋮ for the rest. Few enough to show all on one page.
 */
export function EventsTable({
  org,
  rows,
  support,
}: {
  org: string;
  rows: EventRow[];
  support: boolean;
}) {
  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor("title", {
          id: "evento",
          header: "Evento",
          cell: ({ row: { original: e } }) => (
            <Link
              href={`/panel/${org}/eventos/${e.slug}`}
              className="flex min-h-11 items-center font-display text-px-1 no-underline hover:underline"
            >
              <span>
                {e.title}
                {e.edition && (
                  <span className="text-muted-foreground"> {e.edition}</span>
                )}
              </span>
            </Link>
          ),
        }),
        helper.accessor("phase", {
          id: "fase",
          header: "Fase",
          cell: (c) => <PhaseBadge phase={c.getValue()} />,
        }),
        helper.accessor((e) => e.dates ?? "Sin fecha", {
          id: "fechas",
          header: "Fechas",
        }),
        helper.accessor((e) => e.venue ?? "Sin sede", {
          id: "sede",
          header: "Sede",
        }),
        helper.accessor((e) => e.stats.stands, {
          id: "stands",
          header: "Stands",
          cell: (c) => count(c.getValue()),
        }),
        helper.accessor((e) => e.stats.visitors, {
          id: "visitantes",
          header: "Visitantes",
          cell: (c) => count(c.getValue()),
        }),
        helper.accessor((e) => e.stats.medals, {
          id: "medallas",
          header: "Medallas",
          cell: (c) => count(c.getValue()),
        }),
        helper.display({
          id: "acciones",
          header: () => <span className="sr-only">Acciones</span>,
          cell: ({ row: { original: e } }) => (
            <EventActions
              org={org}
              event={{ id: e.id, slug: e.slug, title: e.title, draft: e.draft }}
              hasSpots={e.stats.stands > 0}
              ready={e.ready}
              publicUrl={e.publicUrl}
              support={support}
            />
          ),
        }),
      ]),
    [org, support],
  );

  return (
    <DataTable
      label="Eventos"
      columns={columns}
      rows={rows}
      rowId={(e) => e.id}
      sortable={{}}
      sort={{ orden: "", dir: "asc" }}
      page={1}
      pageCount={1}
      compactCards
      rowClassName={(e) =>
        e.phase === "finalizado" ? "text-muted-foreground" : undefined
      }
    />
  );
}
