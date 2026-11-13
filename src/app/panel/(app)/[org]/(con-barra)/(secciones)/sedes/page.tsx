import type { Metadata } from "next";
import { EditSheet } from "@/components/panel/EditSheet";
import { PageBody, TopBar } from "@/components/panel/TopBar";
import { timeZoneOptions } from "@/domain/events";
import { listVenuesWithEvents } from "@/lib/data/events";
import { requireOrg } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";
import { EditVenueForm, NewVenueForm } from "./VenueForms";

export async function generateMetadata({
  params,
}: PageProps<"/panel/[org]/sedes">): Promise<Metadata> {
  const { org } = await requireOrg((await params).org);
  return { title: `Sedes · ${org.name}` };
}

/**
 * Venues: each with its address, its zone and how many events use it. New
 * and Editar open side sheets. Without venues the form is the page itself:
 * the event's Editar sheet sends you here to load the first one.
 */
export default async function SedesPage({
  params,
}: PageProps<"/panel/[org]/sedes">) {
  const { org, support } = await requireOrg((await params).org);
  const venues = await listVenuesWithEvents(await createClient(), org.id);

  const form = (
    <NewVenueForm
      org={{
        id: org.id,
        slug: org.slug,
        timezone: org.default_timezone,
      }}
      timezones={timeZoneOptions(org.default_timezone)}
    />
  );
  const newVenue = !support && venues.length > 0 && (
    <EditSheet
      label="Nueva sede"
      variant="primary"
      title="Nueva sede"
      description="Dónde se hacen tus eventos. Su zona horaria es la de los horarios de sus eventos."
    >
      {form}
    </EditSheet>
  );

  return (
    <>
      <TopBar title="Sedes" actions={newVenue} />
      <PageBody>
        {venues.length === 0 ? (
          <section
            aria-labelledby="nueva-sede"
            className="grid max-w-xl gap-6 border-2 border-dashed border-lcd-2 px-6 py-8"
          >
            <div className="grid gap-2">
              <h2 id="nueva-sede" className="text-px-2">
                {support ? "Todavía no hay sedes" : "Nueva sede"}
              </h2>
              <p>
                {support
                  ? "Cuando el equipo cargue una, aparece acá."
                  : "Todavía no hay sedes. Cargá dónde se hacen tus eventos: cada sede define la zona horaria con la que se muestran los horarios."}
              </p>
            </div>
            {!support && form}
          </section>
        ) : (
          <ul className="grid max-w-4xl">
            {venues.map((venue) => (
              <li
                key={venue.id}
                className="grid gap-3 border-2 border-lcd-3 px-4 py-3 not-first:-mt-0.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="grid gap-1">
                  <h2 className="text-px-2">{venue.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {[venue.address_line, venue.city, venue.state]
                      .filter(Boolean)
                      .join(", ") || "Sin dirección"}
                    {" · "}
                    {venue.timezone.replaceAll("_", " ")}
                    {" · "}
                    {venue.events === 0
                      ? "Sin eventos"
                      : `${venue.events.toLocaleString("es-AR")} ${venue.events === 1 ? "evento" : "eventos"}`}
                  </p>
                </div>
                {!support && (
                  <EditSheet
                    label="Editar"
                    ariaLabel={`Editar ${venue.name}`}
                    title={`Editar ${venue.name}`}
                    description="Nombre y dirección de la sede."
                  >
                    <EditVenueForm org={org.slug} venue={venue} />
                  </EditSheet>
                )}
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  );
}
