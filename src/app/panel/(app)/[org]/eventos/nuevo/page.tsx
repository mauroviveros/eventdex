import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageBody, TopBar } from "@/components/admin/TopBar";
import {
  getEventToDuplicate,
  getLastEventTitle,
  listVenues,
} from "@/lib/data/events";
import { requireOrg } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";
import { NewEventForm } from "./NewEventForm";

export async function generateMetadata({
  params,
}: PageProps<"/panel/[org]/eventos/nuevo">): Promise<Metadata> {
  const { org } = await requireOrg((await params).org);
  return { title: `Nuevo evento · ${org.name}` };
}

function spotsCopied(n: number) {
  if (n === 0) return "Ese evento no tiene spots para copiar.";
  return n === 1
    ? "Se copia 1 spot, con su código, puntos y puesto."
    : `Se copian ${n.toLocaleString("es-AR")} spots, con sus códigos, puntos y puestos.`;
}

/** A blank event, or with ?desde=<slug>, a copy of another one of the org. */
export default async function NuevoEventoPage({
  params,
  searchParams,
}: PageProps<"/panel/[org]/eventos/nuevo">) {
  const { org, support } = await requireOrg((await params).org);
  // Support mode is read-only: there's nothing to create.
  if (support) notFound();
  const { desde } = await searchParams;
  const supabase = await createClient();
  const duplicating = typeof desde === "string";
  const [venues, lastTitle, source] = await Promise.all([
    listVenues(supabase, org.id),
    // A copy starts from its source's title instead.
    duplicating ? null : getLastEventTitle(supabase, org.id),
    duplicating ? getEventToDuplicate(supabase, org.id, desde) : null,
  ]);
  if (desde !== undefined && !source) notFound();

  return (
    <>
      <TopBar title="Eventos" />
      <PageBody>
        <div className="grid max-w-xl gap-8">
          <div className="grid gap-2">
            <h1 className="text-px-3 sm:text-px-4">
              {source ? "Duplicar evento" : "Nuevo evento"}
            </h1>
            {source ? (
              <>
                <p>
                  Se crea como borrador a partir de {source.title}.{" "}
                  {spotsCopied(source.spots)} Las jornadas y el banner no se
                  copian: los cargás después.
                </p>
                {source.archived > 0 && (
                  <p>
                    {source.archived === 1
                      ? "1 spot está archivado y queda afuera."
                      : `${source.archived.toLocaleString("es-AR")} spots están archivados y quedan afuera.`}
                  </p>
                )}
              </>
            ) : (
              <p>
                Se crea como borrador. Después le cargás las jornadas y lo
                publicás.
              </p>
            )}
          </div>
          <NewEventForm
            org={{
              id: org.id,
              slug: org.slug,
              timezone: org.default_timezone,
            }}
            venues={venues}
            defaultTitle={lastTitle ?? org.name}
            source={source ?? undefined}
          />
        </div>
      </PageBody>
    </>
  );
}
