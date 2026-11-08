import { getActiveEventId, getPublicEvent } from "@/lib/data/public";
import { createClient } from "@/lib/supabase/server";
import { EventHome } from "./EventHome";
import { requireHostOrganization } from "./organization";

/** The org's home: its active event (live, else next, else last), or an empty state. */
export default async function PublicaHome({
  params,
}: PageProps<"/publica/[host]">) {
  const { org } = await requireHostOrganization((await params).host);
  const supabase = await createClient();
  const eventId = await getActiveEventId(supabase, org.id);
  const event = eventId
    ? await getPublicEvent(supabase, org.id, { by: "id", value: eventId })
    : null;

  return (
    <>
      {event ? (
        <EventHome event={event} now={new Date()} />
      ) : (
        <main className="mx-auto grid w-full max-w-3xl gap-4 px-4 py-12 sm:px-6">
          <h1 className="text-px-3 sm:text-px-4">Todavía no hay eventos</h1>
          <p className="max-w-prose">
            Cuando {org.name} publique su próximo evento, lo vas a ver acá con
            sus fechas, su sede y las medallas para juntar.
          </p>
        </main>
      )}
    </>
  );
}
