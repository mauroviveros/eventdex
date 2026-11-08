import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Celebration } from "@/components/visitante/Celebration";
import { Progress } from "@/components/visitante/Progress";
import { claimSpot } from "@/lib/claims";
import { getClaimTarget, getMyProgress } from "@/lib/data/claims";
import { requireVisitor } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";
import { requireHostOrganization } from "../../organization";

export const metadata: Metadata = {
  title: "Medalla",
  robots: { index: false },
};

/**
 * Where a printed QR lands. Opening it claims the medal: claim_spot() is
 * idempotent, so a reload only answers "ya la tenías". A QR of another org or
 * of an unpublished event is a 404, before asking anyone to sign in.
 */
export default async function ClaimPage({
  params,
}: PageProps<"/publica/[host]/s/[id]">) {
  const { host, id } = await params;
  const { org } = await requireHostOrganization(host);
  const supabase = await createClient();

  const target = await getClaimTarget(supabase, org.id, id);
  if (!target) notFound();
  const visitor = await requireVisitor();

  const claim = await claimSpot(supabase, id);
  if (!claim.ok) throw new Error(claim.error);
  if (!claim.data) notFound();
  const outcome = claim.data;
  const { event, spot } = target;

  let progress = null;
  if (outcome.kind === "nueva" || outcome.kind === "repetida") {
    const p = await getMyProgress(supabase, event.id, visitor.id);
    progress = <Progress claimed={p.medals} total={p.total} />;
  }

  return (
    <main className="mx-auto grid w-full max-w-3xl justify-items-center px-4 py-10 sm:px-6">
      <Celebration
        spot={{ name: spot.name, code: spot.code, type: spot.type }}
        outcome={outcome}
        timeZone={event.timezone}
        eventHref={`/eventos/${event.slug}`}
        progress={progress}
      />
    </main>
  );
}
