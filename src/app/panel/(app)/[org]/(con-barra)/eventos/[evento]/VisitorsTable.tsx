"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTable, type features } from "@/components/panel/DataTable";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/shadcn/badge";
import { formatMoment } from "@/domain/events";
import type { SortDir } from "@/domain/table";
import { setRegistrationBlockedAction } from "@/lib/actions/claims";
import type { listEventVisitors } from "@/lib/data/claims";
import { VISITOR_SORTS } from "./query";

export type Visitor = Awaited<ReturnType<typeof listEventVisitors>>[number];

const helper = createColumnHelper<typeof features, Visitor>();

/** Who registered, with their medals and the block. */
export function VisitorsTable({
  org,
  support,
  timezone,
  ...page
}: {
  org: string;
  support: boolean;
  timezone: string;
  rows: Visitor[];
  sort: { orden: string; dir: SortDir };
  page: number;
  pageCount: number;
}) {
  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor("name", {
          id: "nombre",
          header: "Visitante",
          cell: ({ row: { original: v } }) => (
            <span className="grid min-w-0 gap-0.5">
              <span className="font-display text-px-1 break-words">
                {v.name}
              </span>
              {v.name !== v.email && (
                <span className="text-sm break-all">{v.email}</span>
              )}
            </span>
          ),
        }),
        helper.accessor("medals", {
          id: "medallas",
          header: "Medallas",
          cell: (c) => (
            <span className="font-display text-px-1 tabular-nums">
              {c.getValue().toLocaleString("es-AR")}
            </span>
          ),
        }),
        helper.accessor("created_at", {
          id: "desde",
          header: "Desde",
          cell: (c) => formatMoment(c.getValue(), timezone),
        }),
        helper.display({
          id: "estado",
          header: "Estado",
          cell: ({ row: { original: v } }) =>
            v.blocked_at ? (
              <Badge variant="destructive">Bloqueado</Badge>
            ) : (
              <Badge variant="outline">Activo</Badge>
            ),
        }),
        ...(support
          ? []
          : [
              helper.display({
                id: "acciones",
                header: () => <span className="sr-only">Acciones</span>,
                cell: ({ row: { original: v } }) => (
                  <ActionButton
                    action={setRegistrationBlockedAction}
                    fields={{
                      org,
                      id: v.id,
                      blocked: v.blocked_at ? "0" : "1",
                    }}
                    label={v.blocked_at ? "Desbloquear" : "Bloquear"}
                    pendingLabel={
                      v.blocked_at ? "Desbloqueando…" : "Bloqueando…"
                    }
                    ariaLabel={`${v.blocked_at ? "Desbloquear" : "Bloquear"} a ${v.name}`}
                    confirm={
                      v.blocked_at
                        ? undefined
                        : {
                            message: `${v.name} no va a poder sumar más medallas en este evento.`,
                            label: "Sí, bloquear",
                          }
                    }
                  />
                ),
              }),
            ]),
      ]),
    [org, support, timezone],
  );

  return (
    <DataTable
      label="Visitantes"
      columns={columns}
      rowId={(v) => v.id}
      sortable={VISITOR_SORTS}
      rowClassName={(v) => (v.blocked_at ? "text-muted-foreground" : undefined)}
      {...page}
    />
  );
}
