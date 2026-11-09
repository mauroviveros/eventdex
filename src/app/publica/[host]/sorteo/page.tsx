import type { Metadata } from "next";
import { getPublishedWinners } from "@/lib/data/raffles";
import { createPublicClient } from "@/lib/supabase/public";
import { requireHostOrganization } from "../organization";

export const metadata: Metadata = {
  title: "Ganadores del sorteo",
  // Real people's names: visible at the event, not in a search engine.
  robots: { index: false },
};

/** The winners of `?evento=slug`, or of the org's latest raffle event. */
export default async function GanadoresPage({
  params,
  searchParams,
}: PageProps<"/publica/[host]/sorteo">) {
  const [{ host }, { evento }] = await Promise.all([params, searchParams]);
  const { org } = await requireHostOrganization(host);
  const winners = await getPublishedWinners(
    createPublicClient(),
    org.id,
    typeof evento === "string" ? evento : undefined,
  );

  return (
    <main className="mx-auto grid w-full max-w-3xl gap-10 px-4 py-8 sm:px-6">
      <div className="grid gap-2">
        <h1 className="font-wide text-title text-accent-red sm:text-title-lg">
          {winners ? "Ganadores del sorteo" : "Todavía no hay ganadores"}
        </h1>
        {winners ? (
          <p className="font-display text-px-1 text-accent-yellow">
            {winners.eventTitle}
          </p>
        ) : (
          <p className="max-w-prose">
            Cuando {org.name} publique los ganadores del sorteo, los vas a ver
            acá.
          </p>
        )}
      </div>

      {winners?.raffles.map((raffle) => (
        <section
          key={raffle.id}
          aria-labelledby={`premio-${raffle.id}`}
          className="panel grid gap-4 px-6 py-6"
        >
          <h2 id={`premio-${raffle.id}`} className="text-px-1">
            {raffle.title}
          </h2>
          <ul className="grid gap-2">
            {raffle.winners.map((w) => (
              <li key={w.id} className="font-display text-px-3">
                {w.winner_name}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
