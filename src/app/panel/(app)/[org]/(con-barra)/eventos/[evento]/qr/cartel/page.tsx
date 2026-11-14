import type { Metadata } from "next";
import Link from "next/link";
import { EntrancePoster } from "@/components/panel/EntrancePoster";
import { PageBody, TopBar } from "@/components/panel/TopBar";
import { formatEventDates } from "@/domain/events";
import { prizeLadder } from "@/domain/prizes";
import { eventUrl } from "@/domain/spots";
import { getPrimaryHostname } from "@/lib/data/organizations";
import { listEventPrizes } from "@/lib/data/raffles";
import { listEventSpots } from "@/lib/data/spots";
import { createClient } from "@/lib/supabase/server";
import { load } from "../../load";
import { PrintButton } from "../PrintButton";

export async function generateMetadata({
  params,
}: PageProps<"/panel/[org]/eventos/[evento]/qr/cartel">): Promise<Metadata> {
  const { org: slug, evento } = await params;
  const { event } = await load(slug, evento);
  return { title: `Cartel de entrada · ${event.title}` };
}

/**
 * The entrance poster: one A4 that says why to scan, with the QR of the event's
 * page on the org's domain. It shows the prizes a visitor can win, the same the
 * event's page does.
 */
export default async function PosterPage({
  params,
}: PageProps<"/panel/[org]/eventos/[evento]/qr/cartel">) {
  const { org: slug, evento } = await params;
  const { org, event } = await load(slug, evento);
  const supabase = await createClient();
  const [spots, hostname, prizes] = await Promise.all([
    listEventSpots(supabase, event.id),
    getPrimaryHostname(supabase, org.id),
    listEventPrizes(supabase, event.id),
  ]);
  const active = spots.filter((s) => s.is_active).length;
  const base = `/panel/${org.slug}/eventos/${event.slug}`;

  return (
    <>
      <style>{"@page { size: A4; margin: 10mm; }"}</style>
      <TopBar
        title="Cartel de entrada"
        crumbs={[
          { label: "Eventos", href: `/panel/${org.slug}` },
          { label: "Hoja de QR", href: `${base}/qr` },
        ]}
        actions={hostname && <PrintButton />}
      />
      <PageBody>
        <div className="grid gap-2 print:hidden">
          <h1 className="text-px-3 sm:text-px-4">
            Cartel de entrada · {event.title}
          </h1>
          <p className="max-w-prose">
            Un A4 para la puerta del predio: cuenta qué se gana y lleva el QR de
            la página del evento.
          </p>
        </div>
        {hostname ? (
          <EntrancePoster
            orgName={org.name}
            eventTitle={event.title}
            dates={formatEventDates(event.schedules, event.timezone)}
            venue={event.venue?.name ?? null}
            prizes={prizeLadder(prizes, 0, active).prizes.map((p) => ({
              ...p,
              imageUrl: prizes.find((x) => x.id === p.id)?.imageUrl,
            }))}
            hostname={hostname}
            url={eventUrl(hostname, event.slug)}
          />
        ) : (
          <section className="grid max-w-prose gap-3 border-2 border-dashed border-lcd-2 px-6 py-8">
            <h2 className="text-px-2">Falta el dominio de la organización</h2>
            <p>
              El QR apunta al dominio principal de la organización y todavía no
              tiene uno. Pedíselo al equipo de Eventdex.
            </p>
            <Link href={`${base}/qr`}>Volver a la Hoja de QR</Link>
          </section>
        )}
      </PageBody>
    </>
  );
}
