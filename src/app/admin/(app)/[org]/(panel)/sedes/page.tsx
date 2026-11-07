import type { Metadata } from "next";
import { PageBody, TopBar } from "@/components/admin/TopBar";
import { listVenues } from "@/lib/data/events";
import { requireOrg } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";
import { NewVenueForm } from "./NewVenueForm";

export async function generateMetadata({
  params,
}: PageProps<"/admin/[org]/sedes">): Promise<Metadata> {
  const { org } = await requireOrg((await params).org);
  return { title: `Sedes · ${org.name}` };
}

/** Venues: the list and the form to add one, on the same page. */
export default async function SedesPage({
  params,
}: PageProps<"/admin/[org]/sedes">) {
  const { org, support } = await requireOrg((await params).org);
  const venues = await listVenues(await createClient(), org.id);

  return (
    <>
      <TopBar title="Sedes" />
      <PageBody>
        <h1 className="text-px-3 sm:text-px-4">Sedes</h1>

        <div className="grid gap-10 xl:grid-cols-[1fr_28rem] xl:items-start">
          {venues.length === 0 ? (
            <section className="grid max-w-prose gap-3 border-2 border-dashed border-lcd-2 px-6 py-8">
              <h2 className="text-px-2">Todavía no hay sedes</h2>
              <p>
                Cargá dónde se hacen tus eventos. Cada sede define la zona
                horaria con la que se muestran los horarios.
              </p>
            </section>
          ) : (
            <ul className="grid content-start gap-2">
              {venues.map((venue) => (
                <li
                  key={venue.id}
                  className="grid gap-1 border-2 border-lcd-3 px-4 py-3"
                >
                  <h2 className="text-px-2">{venue.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {[venue.address_line, venue.city, venue.state]
                      .filter(Boolean)
                      .join(", ") || "Sin dirección"}
                    {" · "}
                    {venue.timezone.replaceAll("_", " ")}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {!support && (
            <section
              aria-labelledby="nueva-sede"
              className="panel grid gap-6 p-6"
            >
              <h2 id="nueva-sede" className="text-px-2">
                Nueva sede
              </h2>
              <NewVenueForm
                org={{
                  id: org.id,
                  slug: org.slug,
                  timezone: org.default_timezone,
                }}
                // The org's zone may be an alias Intl doesn't list (America/Argentina/Buenos_Aires).
                timezones={[
                  ...new Set([
                    org.default_timezone,
                    ...Intl.supportedValuesOf("timeZone"),
                  ]),
                ].sort()}
              />
            </section>
          )}
        </div>
      </PageBody>
    </>
  );
}
