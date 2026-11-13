"use client";

import { createColumnHelper } from "@tanstack/react-table";
import Link from "next/link";
import { DataTable, type features } from "@/components/panel/DataTable";

export type AuditRow = {
  id: string;
  /** Already translated ("Factura pagada"). */
  action: string;
  /** Already formatted in Buenos Aires time. */
  when: string;
  organization: { slug: string; name: string } | null;
  actor: string | null;
  diff: string | null;
};

const helper = createColumnHelper<typeof features, AuditRow>();

const columns = helper.columns([
  helper.accessor("action", {
    id: "accion",
    header: "Acción",
    cell: (c) => <span className="font-display text-px-1">{c.getValue()}</span>,
  }),
  helper.accessor("when", {
    id: "cuando",
    header: "Cuándo",
    cell: (c) => (
      <span className="tabular-nums whitespace-nowrap">{c.getValue()}</span>
    ),
  }),
  helper.display({
    id: "organizacion",
    header: "Organización",
    cell: ({ row: { original: r } }) =>
      r.organization ? (
        <Link href={`/panel/plataforma/organizaciones/${r.organization.slug}`}>
          {r.organization.name}
        </Link>
      ) : (
        "—"
      ),
  }),
  helper.accessor((r) => r.actor ?? "—", {
    id: "quien",
    header: "Quién",
    cell: (c) => <span className="break-all">{c.getValue()}</span>,
  }),
  helper.display({
    id: "detalle",
    header: "Detalle",
    cell: ({ row: { original: r } }) =>
      r.diff ? (
        <details>
          <summary className="min-h-6 cursor-pointer">Ver</summary>
          <pre className="mt-2 max-w-md text-sm break-all whitespace-pre-wrap">
            {r.diff}
          </pre>
        </details>
      ) : (
        "—"
      ),
  }),
]);

/** One page of the audit log, newest first; on a phone, compact cards. */
export function AuditTable({ rows }: { rows: AuditRow[] }) {
  return (
    <DataTable
      label="Registro de auditoría"
      columns={columns}
      rows={rows}
      rowId={(r) => r.id}
      sortable={{}}
      sort={{ orden: "", dir: "asc" }}
      page={1}
      pageCount={1}
    />
  );
}
