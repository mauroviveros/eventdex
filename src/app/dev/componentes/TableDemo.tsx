"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { DataTable, type features } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/shadcn/badge";

type Row = { id: string; name: string; medals: number; blocked: boolean };

const helper = createColumnHelper<typeof features, Row>();
const columns = helper.columns([
  helper.accessor("name", { id: "nombre", header: "Visitante" }),
  helper.accessor("medals", {
    id: "medallas",
    header: "Medallas",
    cell: (c) => <span className="tabular-nums">{c.getValue()}</span>,
  }),
  helper.display({
    id: "estado",
    header: "Estado",
    cell: ({ row }) =>
      row.original.blocked ? (
        <Badge variant="destructive">Bloqueado</Badge>
      ) : (
        <Badge variant="outline">Activo</Badge>
      ),
  }),
]);

const ROWS: Row[] = [
  { id: "1", name: "Valeria Visitante", medals: 12, blocked: false },
  { id: "2", name: "Martín Miembro", medals: 7, blocked: false },
  { id: "3", name: "Olivia Dueña", medals: 3, blocked: true },
];

/** DataTable with sample rows: sorted by medals, on page 2 of 3. */
export function TableDemo() {
  return (
    <DataTable
      label="Ejemplo"
      columns={columns}
      rows={ROWS}
      rowId={(r) => r.id}
      sortable={{ nombre: "asc", medallas: "desc" }}
      sort={{ orden: "medallas", dir: "desc" }}
      page={2}
      pageCount={3}
      rowClassName={(r) => (r.blocked ? "text-muted-foreground" : undefined)}
    />
  );
}
