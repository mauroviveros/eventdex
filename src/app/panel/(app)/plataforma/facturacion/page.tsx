import type { Metadata } from "next";
import Link from "next/link";
import { EditSheet } from "@/components/panel/EditSheet";
import { PageBody, TopBar } from "@/components/panel/TopBar";
import { formatMoney } from "@/domain/money";
import { listAllOrganizations } from "@/lib/data/organizations";
import { listInvoices } from "@/lib/data/platform";
import { platformMetadata, requireDeveloper } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";
import { InvoicesTable } from "./InvoicesTable";
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

/** Manual invoices: the list, and Nueva factura in a side sheet from the bar. */
export default async function FacturacionPage() {
  await requireDeveloper();
  const supabase = await createClient();
  const [invoices, organizations] = await Promise.all([
    listInvoices(supabase),
    listAllOrganizations(supabase),
  ]);

  const newInvoice = organizations.length > 0 && (
    <EditSheet
      label="Nueva factura"
      variant="primary"
      title="Nueva factura"
      description="Queda pendiente hasta que la marques pagada."
    >
      <NewInvoiceForm
        organizations={organizations}
        today={TODAY.format(new Date())}
      />
    </EditSheet>
  );

  return (
    <>
      <TopBar title="Facturación" actions={newInvoice} />
      <PageBody>
        {invoices.length === 0 ? (
          <div className="grid max-w-prose gap-2 border-2 border-dashed border-lcd-2 px-6 py-8">
            <p className="font-display text-px-2">Todavía no hay facturas</p>
            <p>
              {organizations.length > 0 ? (
                "Registrá la primera desde Nueva factura."
              ) : (
                <>
                  Para facturar, primero{" "}
                  <Link href="/panel/plataforma/organizaciones/nueva">
                    creá una organización
                  </Link>
                  .
                </>
              )}
            </p>
          </div>
        ) : (
          <InvoicesTable
            rows={invoices.map((i) => ({
              id: i.id,
              concept: i.concept,
              organization: i.organization?.name ?? "—",
              issued: ISSUED.format(new Date(i.issued_on)),
              amount: formatMoney(i.amount_cents, i.currency),
              status: i.status,
            }))}
          />
        )}
      </PageBody>
    </>
  );
}
