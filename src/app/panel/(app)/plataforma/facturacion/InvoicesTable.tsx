"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTable, type features } from "@/components/panel/DataTable";
import { RowActions } from "@/components/panel/RowActions";
import { Badge } from "@/components/ui/shadcn/badge";
import { setInvoiceStatusAction } from "@/lib/actions/platform";

export type InvoiceRow = {
  id: string;
  concept: string;
  organization: string;
  /** Already formatted ("12/11/26"). */
  issued: string;
  /** Already formatted with its currency. */
  amount: string;
  status: "pending" | "paid" | "void";
};

const STATUS = {
  pending: "Pendiente",
  paid: "Pagada",
  void: "Anulada",
} as const;

/** Pending asks for something (ink), paid is done, void is crossed out. */
const BADGE = {
  pending: "default",
  paid: "outline",
  void: "muted",
} as const;

const helper = createColumnHelper<typeof features, InvoiceRow>();

/** The platform's invoices, newest first; each one's actions behind its ⋮. */
export function InvoicesTable({ rows }: { rows: InvoiceRow[] }) {
  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor("concept", {
          id: "concepto",
          header: "Concepto",
          cell: (c) => (
            <span className="font-display text-px-1">{c.getValue()}</span>
          ),
        }),
        helper.accessor("organization", {
          id: "organizacion",
          header: "Organización",
        }),
        helper.accessor("issued", {
          id: "fecha",
          header: "Fecha",
          cell: (c) => <span className="tabular-nums">{c.getValue()}</span>,
        }),
        helper.accessor("amount", {
          id: "monto",
          header: "Monto",
          cell: (c) => (
            <span className="tabular-nums whitespace-nowrap">
              {c.getValue()}
            </span>
          ),
        }),
        helper.accessor("status", {
          id: "estado",
          header: "Estado",
          cell: (c) => (
            <Badge
              variant={BADGE[c.getValue()]}
              className={c.getValue() === "void" ? "line-through" : ""}
            >
              {STATUS[c.getValue()]}
            </Badge>
          ),
        }),
        helper.display({
          id: "acciones",
          header: () => <span className="sr-only">Acciones</span>,
          cell: ({ row: { original: i } }) =>
            i.status !== "void" && (
              <RowActions
                // Concepts repeat ("Expo 2026"): the name says whose and when.
                name={`${i.concept}, ${i.organization}, ${i.issued}`}
                actions={[
                  ...(i.status === "pending"
                    ? [
                        {
                          label: "Marcar pagada",
                          action: setInvoiceStatusAction,
                          fields: { invoiceId: i.id, status: "paid" },
                          done: `${i.concept} quedó pagada.`,
                        },
                      ]
                    : []),
                  {
                    label: "Anular",
                    action: setInvoiceStatusAction,
                    fields: { invoiceId: i.id, status: "void" },
                    done: `${i.concept} quedó anulada.`,
                    confirm: {
                      title: `Anular ${i.concept}`,
                      message:
                        "Una factura anulada no vuelve atrás. Si hace falta, cargá otra.",
                      label: "Sí, anular",
                      pending: "Anulando…",
                    },
                  },
                ]}
              />
            ),
        }),
      ]),
    [],
  );

  return (
    <DataTable
      label="Facturas"
      columns={columns}
      rows={rows}
      rowId={(i) => i.id}
      sortable={{}}
      sort={{ orden: "", dir: "asc" }}
      page={1}
      pageCount={1}
      rowClassName={(i) =>
        i.status === "void" ? "text-muted-foreground" : undefined
      }
    />
  );
}
