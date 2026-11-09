import type { Metadata } from "next";
import Link from "next/link";
import { PageBody, TopBar } from "@/components/admin/TopBar";
import { ActionButton } from "@/components/ui/ActionButton";
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

export default async function FacturacionPage() {
  await requireDeveloper();
  const supabase = await createClient();
  const [invoices, organizations] = await Promise.all([
    listInvoices(supabase),
    listAllOrganizations(supabase),
  ]);

  return (
    <>
      <TopBar title="Plataforma" />
      <PageBody>
        <h1 className="text-px-3 sm:text-px-4">Facturación</h1>

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
              <Link href="/plataforma/organizaciones/nueva">
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-3xl border-collapse text-left">
                <caption className="sr-only">Facturas registradas</caption>
                <thead>
                  <tr className="border-b-2 border-lcd-3 font-display text-px-1">
                    <th scope="col" className="py-2 pr-4 font-normal">
                      Fecha
                    </th>
                    <th scope="col" className="py-2 pr-4 font-normal">
                      Organización
                    </th>
                    <th scope="col" className="py-2 pr-4 font-normal">
                      Concepto
                    </th>
                    <th
                      scope="col"
                      className="py-2 pr-4 text-right font-normal"
                    >
                      Monto
                    </th>
                    <th scope="col" className="py-2 pr-4 font-normal">
                      Estado
                    </th>
                    <th scope="col" className="py-2 font-normal">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b-2 border-dashed border-lcd-2 align-top"
                    >
                      <td className="py-3 pr-4 tabular-nums">
                        {ISSUED.format(new Date(invoice.issued_on))}
                      </td>
                      <td className="py-3 pr-4">
                        {invoice.organization?.name}
                      </td>
                      <td className="py-3 pr-4">{invoice.concept}</td>
                      <td className="py-3 pr-4 text-right tabular-nums whitespace-nowrap">
                        {formatMoney(invoice.amount_cents, invoice.currency)}
                      </td>
                      <td
                        className={`py-3 pr-4 font-display text-px-1 ${invoice.status === "void" ? "text-muted-foreground line-through" : ""}`}
                      >
                        {STATUS[invoice.status]}
                      </td>
                      <td className="py-3">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </PageBody>
    </>
  );
}
