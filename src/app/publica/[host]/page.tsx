import { getActiveEventId, getPublicEvent } from "@/lib/data/public";
import { createClient } from "@/lib/supabase/server";
import { requireHostOrganization } from "./organization";

// shortcut: plain read-out of the data the home needs; the designed home
// (brand, countdown, spots) is R4 · Vista.
export default async function PublicaPage({
  params,
}: PageProps<"/publica/[host]">) {
  const { org } = await requireHostOrganization((await params).host);
  const supabase = await createClient();
  const eventId = await getActiveEventId(supabase, org.id);
  const event = eventId
    ? await getPublicEvent(supabase, org.id, { by: "id", value: eventId })
    : null;

  return (
    <main className="grid gap-4 p-6">
      <h1 className="text-px-3">{org.name}</h1>
      {event ? (
        <section className="grid gap-2">
          <h2 className="text-px-2">{event.title}</h2>
          <p>
            {event.schedules.length} jornadas · {event.spots.length} spots
          </p>
        </section>
      ) : (
        <p>Todavía no hay eventos publicados.</p>
      )}
    </main>
  );
}
