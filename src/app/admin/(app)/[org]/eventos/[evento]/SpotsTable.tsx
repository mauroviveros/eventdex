"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTable, type features } from "@/components/admin/DataTable";
import { Sprite } from "@/components/pixel/Sprite";
import { ActionButton } from "@/components/ui/ActionButton";
import { buttonClass } from "@/components/ui/Button";
import { Badge } from "@/components/ui/shadcn/badge";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/shadcn/sheet";
import { SPOT_TYPE_LABEL } from "@/domain/spots";
import type { SortDir } from "@/domain/table";
import { removeEventSpotAction } from "@/lib/actions/spots";
import type { listEventSpots } from "@/lib/data/spots";
import { SPOT_SORTS } from "./query";
import { EditEventSpotForm } from "./spots/EventSpotForms";

type Spot = Awaited<ReturnType<typeof listEventSpots>>[number];

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
    <Sheet>
      <SheetTrigger
        className={buttonClass("secondary")}
        aria-label={`Editar ${s.shown.name}`}
      >
        Editar
      </SheetTrigger>
      <SheetContent className="w-full gap-8 overflow-y-auto p-6 sm:max-w-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-1">
            <SheetTitle className="text-px-2">
              {s.code} · {s.shown.name}
            </SheetTitle>
            <SheetDescription>
              Lo que cambies acá vale solo para este evento. El QR no cambia.
            </SheetDescription>
          </div>
          <SheetClose className={buttonClass("secondary")}>Cerrar</SheetClose>
        </div>
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
      </SheetContent>
    </Sheet>
  );
}
