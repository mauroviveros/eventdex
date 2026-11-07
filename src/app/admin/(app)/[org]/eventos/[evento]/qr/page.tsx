import type { Metadata } from "next";
import Link from "next/link";
import { QrCode } from "@/components/admin/QrCode";
import { PageBody, TopBar } from "@/components/admin/TopBar";
import { spotUrl } from "@/domain/spots";
import { getPrimaryHostname } from "@/lib/data/organizations";
import { listEventSpots } from "@/lib/data/spots";
import { createClient } from "@/lib/supabase/server";
import { load } from "../load";
import { PrintButton } from "./PrintButton";

export async function generateMetadata({
  params,
}: PageProps<"/admin/[org]/eventos/[evento]/qr">): Promise<Metadata> {
  const { org: slug, evento } = await params;
  const { event } = await load(slug, evento);
  return { title: `Hoja de QR · ${event.title}` };
}

/**
 * The QR sheet: one card per active spot, to print on A4 and cut along the
 * dashed lines. Each QR opens /s/[id] on the org's domain, which never changes.
 */
export default async function QrSheetPage({
  params,
}: PageProps<"/admin/[org]/eventos/[evento]/qr">) {
  const { org: slug, evento } = await params;
  const { org, event } = await load(slug, evento);
  const supabase = await createClient();
  const [spots, hostname] = await Promise.all([
    listEventSpots(supabase, event.id),
    getPrimaryHostname(supabase, org.id),
  ]);
  const active = spots.filter((s) => s.is_active);
  const inactive = spots.length - active.length;
  const base = `/${org.slug}/eventos/${event.slug}`;

  return (
    <>
      {/* A4 with a margin every printer can reach. */}
      <style>{"@page { size: A4; margin: 10mm; }"}</style>
      <TopBar
        title="Eventos"
        actions={
          <>
            <Link
              href={`${base}/spots`}
              className="flex min-h-11 items-center font-display text-px-1"
            >
              Volver a los spots
            </Link>
            {hostname && active.length > 0 && <PrintButton />}
          </>
        }
      />
      <PageBody>
        <div className="grid gap-2 print:hidden">
          <h1 className="text-px-3 sm:text-px-4">Hoja de QR · {event.title}</h1>
          <p className="max-w-prose">
            Una tarjeta por spot activo, para imprimir en A4 y recortar por la
            línea punteada. Cada QR abre la medalla en{" "}
            <strong>{hostname ?? "el dominio de la organización"}</strong>.
            {inactive > 0 &&
              ` ${inactive === 1 ? "Un spot inactivo no se imprime" : `${inactive} spots inactivos no se imprimen`}.`}
          </p>
        </div>

        {!hostname ? (
          <section className="grid max-w-prose gap-3 border-2 border-dashed border-lcd-2 px-6 py-8">
            <h2 className="text-px-2">Falta el dominio de la organización</h2>
            <p>
              Los QR apuntan al dominio principal de la organización y todavía
              no tiene uno. Pedíselo al equipo de Eventdex.
            </p>
          </section>
        ) : active.length === 0 ? (
          <section className="grid max-w-prose gap-3 border-2 border-dashed border-lcd-2 px-6 py-8">
            <h2 className="text-px-2">No hay spots para imprimir</h2>
            <p>
              Agregá spots al evento, o activá los que están, y vuelven a
              aparecer acá.
            </p>
            <Link href={`${base}/spots`}>Ir a los spots del evento</Link>
          </section>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3">
            {active.map((s) => (
              <li
                key={s.id}
                className="grid break-inside-avoid justify-items-center gap-2 border-2 border-dashed border-lcd-2 p-[5mm] text-center"
              >
                <QrCode
                  value={spotUrl(hostname, s.id)}
                  label={`QR de ${s.shown.name}, código ${s.code}`}
                  className="w-[40mm]"
                />
                <p className="font-display text-px-3 leading-none">{s.code}</p>
                <p className="line-clamp-2 text-sm font-bold">{s.shown.name}</p>
                <p className="text-xs">
                  {[s.booth, event.title].filter(Boolean).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  );
}
