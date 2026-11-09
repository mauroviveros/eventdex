import type { Metadata } from "next";
import { StatTile } from "@/components/admin/StatTile";
import { PageBody, TopBar } from "@/components/admin/TopBar";
import { formatMoney } from "@/domain/money";
import { getPlatformSummary } from "@/lib/data/platform";
import { platformMetadata, requireDeveloper } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";

export function generateMetadata(): Promise<Metadata> {
  return platformMetadata("Resumen · Plataforma");
}

export default async function PlataformaPage() {
  await requireDeveloper();
  const summary = await getPlatformSummary(await createClient());
  const owed = summary.pendingByCurrency.filter((p) => p.cents > 0);

  return (
    <>
      <TopBar title="Plataforma" />
      <PageBody>
        <h1 className="text-px-3 sm:text-px-4">Resumen</h1>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile
            label="Organizaciones"
            value={summary.organizations}
            caption={
              summary.suspended > 0
                ? `${summary.suspended} ${summary.suspended === 1 ? "suspendida" : "suspendidas"}`
                : "Todas activas"
            }
          />
          <StatTile
            label="Eventos en curso"
            value={summary.liveEvents}
            caption="En este momento"
          />
          <StatTile
            label="Facturas pendientes"
            value={summary.pendingInvoices}
            caption={
              owed.length > 0
                ? owed.map((p) => formatMoney(p.cents, p.currency)).join(" · ")
                : "Nada por cobrar"
            }
          />
        </div>
      </PageBody>
    </>
  );
}
