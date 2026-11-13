"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTable, type features } from "@/components/panel/DataTable";
import { EditSheet } from "@/components/panel/EditSheet";
import { Sprite } from "@/components/pixel/Sprite";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/shadcn/badge";
import { SPOT_TYPE_LABEL } from "@/domain/spots";
import type { SortDir } from "@/domain/table";
import { removeEventSpotAction } from "@/lib/actions/spots";
import type { listEventSpots } from "@/lib/data/spots";
import { EditEventSpotForm } from "./EventSpotForms";
import { SPOT_SORTS } from "./query";

export type Spot = Awaited<ReturnType<typeof listEventSpots>>[number];

const helper = createColumnHelper<typeof features, Spot>();

/** The event's spots, one per row, with their sheet to edit or remove them. */
export function SpotsTable({
  org,
  support,
  ...page
}: {
  org: string;
  support: boolean;
  rows: Spot[];
  sort: { orden: string; dir: SortDir };
  page: number;
  pageCount: number;
}) {
  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor("code", {
          id: "codigo",
          header: "Código",
          cell: (c) => (
            <span className="font-display text-px-2">{c.getValue()}</span>
          ),
        }),
        helper.accessor((s) => s.shown.name, {
          id: "nombre",
          header: "Spot",
          cell: ({ row: { original: s } }) => (
            <span className="flex items-center gap-3">
              <Sprite
                type={s.shown.type}
                mode={s.is_active ? "lleno" : "inactivo"}
                scale={3}
                label={SPOT_TYPE_LABEL[s.shown.type]}
              />
              <span className="font-display text-px-1">{s.shown.name}</span>
            </span>
          ),
        }),
        helper.accessor((s) => s.booth ?? "", {
          id: "puesto",
          header: "Puesto",
          cell: (c) => c.getValue() || "—",
        }),
        helper.accessor("points", {
          id: "puntos",
          header: "Puntos",
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
            s.is_active ? (
              <Badge variant="outline">Activo</Badge>
            ) : (
              <Badge variant="muted" className="border-dashed">
                Inactivo
              </Badge>
            ),
        }),
        ...(support
          ? []
          : [
              helper.display({
                id: "acciones",
                header: () => <span className="sr-only">Acciones</span>,
                cell: ({ row: { original: s } }) => (
                  <SpotSheet org={org} spot={s} />
                ),
              }),
            ]),
      ]),
    [org, support],
  );

  return (
    <DataTable
      label="Spots del evento"
      columns={columns}
      rowId={(s) => s.id}
      sortable={SPOT_SORTS}
      rowClassName={(s) => (s.is_active ? undefined : "text-muted-foreground")}
      {...page}
    />
  );
}

function SpotSheet({ org, spot: s }: { org: string; spot: Spot }) {
  return (
    <EditSheet
      label="Editar"
      ariaLabel={`Editar ${s.shown.name}`}
      title={`${s.code} · ${s.shown.name}`}
      description="Lo que cambies acá vale solo para este evento. El QR no cambia."
      // Removing the spot takes its row, and this "Editar", with it.
      fallbackFocus="en-el-evento"
    >
      <EditEventSpotForm org={org} spot={s} catalogName={s.defaultName} />
      <ActionButton
        action={removeEventSpotAction}
        fields={{ org, id: s.id }}
        label="Quitar del evento"
        pendingLabel="Quitando…"
        ariaLabel={`Quitar ${s.shown.name} del evento`}
        confirm={{
          message: `Su QR deja de funcionar, también el que ya esté impreso. Si volvés a agregarlo, tiene un QR nuevo. Si el stand no vino, mejor desactivalo.`,
          label: `Quitar ${s.code}`,
        }}
      />
    </EditSheet>
  );
}
