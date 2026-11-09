import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { Medal } from "@/components/visitante/Medal";
import { Progress } from "@/components/visitante/Progress";
import { collectionProgress } from "@/domain/claims";
import { eventPhase } from "@/domain/events";
import { listMyClaims, listMyEvents } from "@/lib/data/claims";
import { spotLogoUrl } from "@/lib/data/organizations";
import { getActiveEvent, getPublicEvent } from "@/lib/data/public";
import { requireVisitor } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";
import { requireHostOrganization } from "../organization";

export const metadata: Metadata = {
  title: "Mis medallas",
  robots: { index: false },
};

type EventName = { title: string; edition_label: string | null };

const eventName = (e: EventName) =>
  e.edition_label ? `${e.title} · ${e.edition_label}` : e.title;

/** The visitor's collection in one event: what they have and what's left. */
export default async function MisMedallasPage({
  params,
  searchParams,
}: PageProps<"/publica/[host]/mis-medallas">) {
  const { org } = await requireHostOrganization((await params).host);
  const { evento } = await searchParams;
  const supabase = await createClient();
  const [visitor, active] = await Promise.all([
    requireVisitor(),
    getActiveEvent(supabase, org.id),
  ]);
  const myEvents = await listMyEvents(supabase, org.id, visitor.id);
  // A live event is where the visitor is collecting now. Otherwise the active
  // one may be next week's: show the last event they collected in instead.
  const live =
    active && eventPhase(active.status, active.schedules) === "en-curso";
  const slug =
    myEvents.find((e) => e.slug === evento)?.slug ??
    (live ? undefined : myEvents[0]?.slug);
  const event =
    slug && slug !== active?.slug
      ? ((await getPublicEvent(supabase, org.id, slug)) ?? active)
      : active;
  const mine = event ? await listMyClaims(supabase, event.id, visitor.id) : [];
  const claimed = new Set(mine.map((c) => c.event_spot_id));

  return (
    <main className="mx-auto grid w-full max-w-3xl gap-10 px-4 py-8 sm:px-6">
      <div className="grid gap-2">
        <h1 className="text-px-3 sm:text-px-4">Mis medallas</h1>
        {event && <p className="font-display text-px-1">{eventName(event)}</p>}
      </div>

      {myEvents.some((e) => e.slug !== event?.slug) && (
        <nav aria-label="Tus eventos">
          <ul className="flex flex-wrap gap-2">
            {myEvents.map((e) => {
              const current = e.slug === event?.slug;
              return (
                <li key={e.slug}>
                  <Link
                    href={`/mis-medallas?evento=${e.slug}`}
                    aria-current={current ? "page" : undefined}
                    className={`flex min-h-11 items-center border-2 border-lcd-3 px-3 py-2 font-display text-px-1 no-underline ${
                      current ? "bg-lcd-1" : ""
                    }`}
                  >
                    {eventName(e)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {!event ? (
        <p className="max-w-prose border-2 border-dashed border-lcd-2 px-6 py-8">
          Todavía no hay eventos de {org.name}. Cuando haya uno, acá vas a ver
          tus medallas.
        </p>
      ) : (
        <>
          <Collection
            spots={event.spots}
            claimed={claimed}
            finished={
              eventPhase(event.status, event.schedules) === "finalizado"
            }
          />
          <Link
            href={`/eventos/${event.slug}`}
            className={buttonClass(
              "secondary",
              "justify-self-start no-underline",
            )}
          >
            Ver el evento
          </Link>
        </>
      )}
    </main>
  );
}

type Spot = Parameters<typeof collectionProgress>[0][number] & {
  name: string;
  code: string;
  type: Parameters<typeof Medal>[0]["type"];
  logoPath: string | null;
};

function Collection({
  spots,
  claimed,
  finished,
}: {
  spots: readonly Spot[];
  claimed: ReadonlySet<string>;
  finished: boolean;
}) {
  const p = collectionProgress(spots, claimed);
  if (spots.length === 0) {
    return (
      <p className="max-w-prose border-2 border-dashed border-lcd-2 px-6 py-8">
        Los stands del evento todavía no se cargaron. Volvé más cerca de la
        fecha.
      </p>
    );
  }
  return (
    <>
      <Progress claimed={p.medals} total={p.total} finished={finished} />
      <ul aria-label="Tu colección" className="flex flex-wrap gap-x-2 gap-y-6">
        {spots.map((s) => (
          <li key={s.id}>
            <Medal
              name={s.name}
              code={s.code}
              type={s.type}
              logo={spotLogoUrl(s.logoPath)}
              state={claimed.has(s.id) ? "conseguida" : "pendiente"}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
