import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { Medal } from "@/components/visitante/Medal";
import { Progress } from "@/components/visitante/Progress";
import { collectionProgress } from "@/domain/claims";
import { eventPhase } from "@/domain/events";
import { listMyClaims } from "@/lib/data/claims";
import { getActiveEvent } from "@/lib/data/public";
import { requireViewer } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";
import { requireHostOrganization } from "../organization";

export const metadata: Metadata = {
  title: "Mis medallas",
  robots: { index: false },
};

/** The visitor's collection in the org's current event: what they have and what's left. */
export default async function MisMedallasPage({
  params,
}: PageProps<"/publica/[host]/mis-medallas">) {
  const { org } = await requireHostOrganization((await params).host);
  const viewer = await requireViewer();
  const supabase = await createClient();
  const event = await getActiveEvent(supabase, org.id);
  const mine = event ? await listMyClaims(supabase, event.id, viewer.id) : [];
  const claimed = new Set(mine.map((c) => c.event_spot_id));

  return (
    <main className="mx-auto grid w-full max-w-3xl gap-10 px-4 py-8 sm:px-6">
      <div className="grid gap-2">
        <h1 className="text-px-3 sm:text-px-4">Mis medallas</h1>
        {event && <p className="font-display text-px-1">{event.title}</p>}
      </div>

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
            href="/"
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
              state={claimed.has(s.id) ? "conseguida" : "pendiente"}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
