import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buttonClass } from "@/components/ui/Button";
import {
  History,
  HistoryFailed,
  HistoryLoading,
} from "@/components/visitante/History";
import type { Medal } from "@/components/visitante/Medal";
import { MedalGrid } from "@/components/visitante/MedalGrid";
import { PrizesLadder } from "@/components/visitante/Prizes";
import { ProfileHeader } from "@/components/visitante/ProfileHeader";
import { Progress } from "@/components/visitante/Progress";
import { ShareCardButton } from "@/components/visitante/ShareCardButton";
import { collectionProgress } from "@/domain/claims";
import { eventPhase } from "@/domain/events";
import { listMyClaims, listMyEvents } from "@/lib/data/claims";
import { getMyHistory } from "@/lib/data/history";
import { getActiveEvent, getPublicEvent } from "@/lib/data/public";
import { listEventPrizes } from "@/lib/data/raffles";
import {
  getVisitorRole,
  getVisitorSince,
  requireVisitor,
} from "@/lib/data/viewer";
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
  const visitor = await requireVisitor();
  const [active, myEvents] = await Promise.all([
    getActiveEvent(supabase, org.id),
    listMyEvents(supabase, org.id, visitor.id),
  ]);
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
  const prizes = event ? await listEventPrizes(supabase, event.id) : [];
  const medals = event?.spots.filter((s) => claimed.has(s.id)) ?? [];
  const standing = await standingOrNone(org.id, visitor.id);
  return (
    <main className="mx-auto grid w-full max-w-3xl gap-10 px-4 py-8 sm:px-6">
      <div className="grid gap-2">
        <h1 className="font-wide text-title sm:text-title-lg">Mis medallas</h1>
        {event && <p className="font-display text-px-1">{eventName(event)}</p>}
      </div>

      <ProfileHeader
        account={visitor}
        teamRole={standing.role ?? undefined}
        since={standing.since}
        share={
          event && medals.length > 0 ? (
            <ShareCardButton
              key={event.slug}
              href={`/mis-medallas/tarjeta?evento=${event.slug}`}
              fileName={`tarjeta-${event.slug}.png`}
              variant="secondary"
            />
          ) : null
        }
      />

      {!event ? (
        <p className="max-w-prose border-2 border-dashed border-lcd-2 px-6 py-8">
          Todavía no hay eventos de {org.name}. Cuando haya uno, acá vas a ver
          tus medallas.
        </p>
      ) : (
        <>
          <Collection
            prizes={prizes}
            spots={event.spots}
            claimed={claimed}
            finished={
              eventPhase(event.status, event.schedules) === "finalizado"
            }
          />
          <Suspense fallback={<HistoryLoading />}>
            <MyHistory
              organizationId={org.id}
              userId={visitor.id}
              current={event.slug}
            />
          </Suspense>
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
  prizes,
  spots,
  claimed,
  finished,
}: {
  prizes: Parameters<typeof PrizesLadder>[0]["prizes"];
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
      <PrizesLadder prizes={prizes} claimed={p.medals} total={p.total} />
      <MedalGrid spots={spots} claimed={claimed} label="Tu colección" />
    </>
  );
}

/** Role and "since" for the header; if the read fails the page stands without them. */
async function standingOrNone(organizationId: string, userId: string) {
  try {
    const [role, since] = await Promise.all([
      getVisitorRole(organizationId, userId),
      getVisitorSince(organizationId, userId),
    ]);
    return { role, since };
  } catch (error) {
    console.error("mis-medallas: standing", error);
    return { role: null, since: null };
  }
}

/** The visitor's history; if the read fails, only this section says so. */
async function MyHistory({
  organizationId,
  userId,
  current,
}: {
  organizationId: string;
  userId: string;
  current: string;
}) {
  try {
    const history = await getMyHistory(
      await createClient(),
      organizationId,
      userId,
    );
    return <History history={history} current={current} />;
  } catch (error) {
    console.error("reading the visitor's history failed", error);
    return <HistoryFailed />;
  }
}
