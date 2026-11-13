"use client";

import { createColumnHelper } from "@tanstack/react-table";
import Link from "next/link";
import { DataTable, type features } from "@/components/panel/DataTable";
import { Badge } from "@/components/ui/shadcn/badge";

export type OrganizationRow = {
  id: string;
  slug: string;
  name: string;
  hostname: string | null;
  status: "active" | "suspended";
  members: number;
  pendingInvitations: string[];
};

const helper = createColumnHelper<typeof features, OrganizationRow>();

const columns = helper.columns([
  helper.accessor("name", {
    id: "organizacion",
    header: "Organización",
    cell: ({ row: { original: o } }) => (
      <Link
        href={`/panel/plataforma/organizaciones/${o.slug}`}
        className="flex min-h-11 flex-col justify-center no-underline hover:underline"
      >
        <span className="font-display text-px-1">{o.name}</span>
        <span className="text-sm text-muted-foreground">{o.slug}</span>
      </Link>
    ),
  }),
  helper.accessor((o) => o.hostname ?? "—", {
    id: "dominio",
    header: "Dominio",
    cell: (c) => <span className="break-all">{c.getValue()}</span>,
  }),
  helper.accessor("status", {
    id: "estado",
    header: "Estado",
    cell: (c) =>
      c.getValue() === "active" ? (
        <Badge variant="outline">Activa</Badge>
      ) : (
        <Badge variant="destructive">Suspendida</Badge>
      ),
  }),
  helper.accessor("members", {
    id: "equipo",
    header: "Equipo",
    cell: (c) => <span className="tabular-nums">{c.getValue()}</span>,
  }),
  helper.accessor(
    (o) =>
      o.pendingInvitations.length > 0 ? o.pendingInvitations.join(", ") : "—",
    {
      id: "invitacion",
      header: "Invitación abierta",
      cell: (c) => <span className="break-all">{c.getValue()}</span>,
    },
  ),
]);

/** Every organization: the name opens its page; on a phone, compact cards. */
export function OrganizationsTable({ rows }: { rows: OrganizationRow[] }) {
  return (
    <DataTable
      label="Organizaciones"
      columns={columns}
      rows={rows}
      rowId={(o) => o.id}
      sortable={{}}
      sort={{ orden: "", dir: "asc" }}
      page={1}
      pageCount={1}
      rowClassName={(o) =>
        o.status === "suspended" ? "text-muted-foreground" : undefined
      }
    />
  );
}
