import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Celebration } from "@/components/visitante/Celebration";
import { LockedMedal } from "@/components/visitante/LockedMedal";
import { hasPrizes, PrizeNotice } from "@/components/visitante/Prizes";
import { Progress } from "@/components/visitante/Progress";
import { claimSpot } from "@/lib/claims";
import { getClaimTarget, getMyProgress } from "@/lib/data/claims";
import { spotLogoUrl } from "@/lib/data/organizations";
import { listEventPrizes } from "@/lib/data/raffles";
import { getVisitorAccount } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";
import { requireHostOrganization } from "../../organization";

export const metadata: Metadata = {
  title: "Medalla",
  robots: { index: false },
};

/**
 * Where a printed QR lands. Opening it claims the medal: claim_spot() is
 * idempotent, so a reload only answers "ya la tenías". A QR of another org or
 * of an unpublished event is a real 404, before asking anyone to sign in: both
 * checks run before the response starts, and only the claim streams.
 */
export default async function ClaimPage({
  params,
  searchParams,
}: PageProps<"/publica/[host]/s/[id]">) {
  const { host, id } = await params;
  const { org } = await requireHostOrganization(host);
  const supabase = await createClient();

  const target = await getClaimTarget(supabase, org.id, id);
  if (!target) notFound();
  const visitor = await getVisitorAccount();
  if (!visitor) {
    const { name, code, type } = target.spot;
    return (
      <main className="mx-auto grid w-full max-w-3xl justify-items-center px-4 py-10 sm:px-6">
        <LockedMedal
          spot={{ name, code, type }}
          next={`/s/${id}`}
          failed={(await searchParams).error === "auth"}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-3xl justify-items-center px-4 py-10 sm:px-6">
      {/* Outside the boundary: a live region only announces changes made inside it once it exists. */}
      <div aria-live="polite" className="grid w-full justify-items-center">
        <Suspense fallback={<Claiming />}>
          <Claim target={target} visitorId={visitor.id} />
        </Suspense>
      </div>
    </main>
  );
}

type Target = NonNullable<Awaited<ReturnType<typeof getClaimTarget>>>;

async function Claim({
  target: { event, spot },
  visitorId,
}: {
  target: Target;
  visitorId: string;
}) {
  const supabase = await createClient();
  const claim = await claimSpot(supabase, spot.id);
  if (!claim.ok) throw new Error(claim.error);
  if (!claim.data) notFound();
  const outcome = claim.data;

  let progress = null;
  if (outcome.kind === "nueva" || outcome.kind === "repetida") {
    const p = await getMyProgress(supabase, event.id, visitorId);
    const prizes = await listEventPrizes(supabase, event.id);
    // With prizes, the bar carries their cups; without, the plain progress.
    progress = hasPrizes(prizes, p.medals, p.total) ? (
      <PrizeNotice prizes={prizes} claimed={p.medals} total={p.total} />
    ) : (
      <Progress claimed={p.medals} total={p.total} />
    );
  }

  return (
    <Celebration
      spot={{
        name: spot.name,
        code: spot.code,
        type: spot.type,
        logo: spotLogoUrl(spot.logoPath),
      }}
      outcome={outcome}
      timeZone={event.timezone}
      eventHref={`/eventos/${event.slug}`}
      progress={progress}
    />
  );
}

/** While the medal is claimed: the celebration's panel, still empty. */
function Claiming() {
  return (
    <div className="panel grid w-full max-w-sm justify-items-center gap-5 px-6 py-8 text-center">
      <div className="size-40 border-2 border-dashed border-lcd-2" />
      <p className="font-display text-px-2">Sumando la medalla…</p>
    </div>
  );
}
