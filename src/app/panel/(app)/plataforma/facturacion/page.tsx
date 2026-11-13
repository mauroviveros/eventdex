import type { Metadata } from "next";
import Link from "next/link";
import { PageBody, TopBar } from "@/components/panel/TopBar";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/shadcn/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/shadcn/table";
import { formatMoney } from "@/domain/money";
import { setInvoiceStatusAction } from "@/lib/actions/platform";
import { listAllOrganizations } from "@/lib/data/organizations";
import { listInvoices } from "@/lib/data/platform";
import { platformMetadata, requireDeveloper } from "@/lib/data/viewer";
import type { Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { NewInvoiceForm } from "./NewInvoiceForm";

export function generateMetadata(): Promise<Metadata> {
  return platformMetadata("Facturación · Plataforma");
}

const ISSUED = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeZone: "UTC",
});

// en-CA formats as YYYY-MM-DD, what a date input expects.
const TODAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
});

const STATUS: Record<Enums<"invoice_status">, string> = {
  pending: "Pendiente",
  paid: "Pagada",
  void: "Anulada",
};

/** Pending asks for something (ink), paid is done, void is crossed out. */
const INVOICE_BADGE = {
  pending: "default",
  paid: "outline",
  void: "muted",
} as const satisfies Record<Enums<"invoice_status">, string>;

export default async function FacturacionPage() {
  await requireDeveloper();
  const supabase = await createClient();
  const [invoices, organizations] = await Promise.all([
    listInvoices(supabase),
    listAllOrganizations(supabase),
  ]);

  return (
    <>
      <TopBar title="Facturación" />
      <PageBody>
        <section className="grid max-w-2xl gap-4">
          <h2 className="text-px-2">Nueva factura</h2>
          {organizations.length > 0 ? (
            <NewInvoiceForm
              organizations={organizations}
              today={TODAY.format(new Date())}
            />
          ) : (
            <p>
              Para facturar, primero{" "}
              <Link href="/panel/plataforma/organizaciones/nueva">
                creá una organización
              </Link>
              .
            </p>
          )}
        </section>

        <section className="grid gap-4">
          <h2 className="text-px-2">Facturas</h2>
          {invoices.length === 0 ? (
            <p className="text-muted-foreground">
              Todavía no registraste ninguna factura.
            </p>
          ) : (
            <Table className="min-w-3xl">
              <TableCaption className="sr-only">
                Facturas registradas
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Organización</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="tabular-nums">
                      {ISSUED.format(new Date(invoice.issued_on))}
                    </TableCell>
                    <TableCell>{invoice.organization?.name}</TableCell>
                    <TableCell>{invoice.concept}</TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">
                      {formatMoney(invoice.amount_cents, invoice.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={INVOICE_BADGE[invoice.status]}
                        className={
                          invoice.status === "void" ? "line-through" : ""
                        }
                      >
                        {STATUS[invoice.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invoice.status !== "void" && (
                        <div className="flex flex-wrap items-start gap-2">
                          {invoice.status === "pending" && (
                            <ActionButton
                              action={setInvoiceStatusAction}
                              fields={{
                                invoiceId: invoice.id,
                                status: "paid",
                              }}
                              label="Marcar pagada"
                              pendingLabel="Guardando…"
                              ariaLabel={`Marcar pagada ${invoice.concept}`}
                            />
                          )}
                          <ActionButton
                            action={setInvoiceStatusAction}
                            fields={{ invoiceId: invoice.id, status: "void" }}
                            label="Anular"
                            pendingLabel="Anulando…"
                            ariaLabel={`Anular ${invoice.concept}`}
                            confirm={{
                              message:
                                "Una factura anulada no vuelve atrás. Si hace falta, cargá otra.",
                              label: "Sí, anular",
                            }}
                          />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </PageBody>
    </>
  );
}
