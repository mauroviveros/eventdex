import type { Metadata } from "next";
import { StatStrip } from "@/components/panel/StatStrip";
import { PageBody, TopBar } from "@/components/panel/TopBar";
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
      <TopBar title="Resumen" />
      <PageBody>
        <StatStrip
          cells={[
            [
              "Organizaciones",
              summary.organizations.toLocaleString("es-AR"),
              summary.suspended > 0
                ? `${summary.suspended} ${summary.suspended === 1 ? "suspendida" : "suspendidas"}`
                : "Todas activas",
            ],
            [
              "Eventos en curso",
              summary.liveEvents.toLocaleString("es-AR"),
              "En este momento",
            ],
            [
              "Facturas pendientes",
              summary.pendingInvoices.toLocaleString("es-AR"),
              owed.length > 0
                ? owed.map((p) => formatMoney(p.cents, p.currency)).join(" · ")
                : "Nada por cobrar",
            ],
          ]}
        />
      </PageBody>
    </>
  );
}
