"use client";

import { createColumnHelper } from "@tanstack/react-table";
import Link from "next/link";
import { useMemo } from "react";
import { DataTable, type features } from "@/components/admin/DataTable";
import { Sprite } from "@/components/pixel/Sprite";
import { Badge } from "@/components/ui/shadcn/badge";
import { SPOT_TYPE_LABEL } from "@/domain/spots";
import type { SortDir } from "@/domain/table";
import type { listSpots } from "@/lib/data/spots";
import { CATALOG_SORTS } from "./query";

export type CatalogSpot = Awaited<ReturnType<typeof listSpots>>[number];

const helper = createColumnHelper<typeof features, CatalogSpot>();

/** The catalog, one spot per row; the name opens its page. */
export function CatalogTable({
  org,
  ...page
}: {
  org: string;
  rows: CatalogSpot[];
  sort: { orden: string; dir: SortDir };
  page: number;
  pageCount: number;
}) {
  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor("name", {
          id: "nombre",
          header: "Spot",
          cell: ({ row: { original: s } }) => (
            <Link
              href={`/${org}/spots/${s.id}`}
              className="flex min-h-11 items-center gap-3 no-underline hover:underline"
            >
              <Sprite
                type={s.type}
                mode={s.archived_at ? "inactivo" : "lleno"}
                scale={3}
                label={SPOT_TYPE_LABEL[s.type]}
              />
              <span className="font-display text-px-1">{s.name}</span>
            </Link>
          ),
        }),
        helper.accessor((s) => SPOT_TYPE_LABEL[s.type], {
          id: "tipo",
          header: "Tipo",
        }),
        helper.accessor("uses", {
          id: "eventos",
          header: "Eventos",
          cell: (c) => (
            <span className="tabular-nums">
              {c.getValue().toLocaleString("es-AR")}
            </span>
          ),
        }),
        helper.display({
          id: "estado",
          header: "Estado",
          cell: ({ row: { original: s } }) =>
            s.archived_at ? (
              <Badge variant="muted" className="border-dashed">
                Archivado
              </Badge>
            ) : (
              <Badge variant="outline">Activo</Badge>
            ),
        }),
      ]),
    [org],
  );

  return (
    <DataTable
      label="Catálogo de spots"
      columns={columns}
      rowId={(s) => s.id}
      sortable={CATALOG_SORTS}
      rowClassName={(s) =>
        s.archived_at ? "text-muted-foreground" : undefined
      }
      {...page}
    />
  );
}
