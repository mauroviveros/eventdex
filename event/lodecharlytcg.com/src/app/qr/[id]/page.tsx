import { Card, CardContent } from "@/components/ui/card";
import { SITE_SLUG } from "@/constants";
import { createClient } from "@/libs/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

export default async function SpotQR({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient(await cookies());

  const { data: spot } = await supabase
    .from("event_spots")
    .select(`*, event:event_id(id, slug)`)
    .eq("id", id)
    .eq("event.slug", SITE_SLUG)
    .maybeSingle();

  if (!spot) notFound();

  return (
    <section className="flex min-h-[calc(100dvh-5rem)] items-center justify-center px-4 py-8">
      <Card className="highlight w-full max-w-2xl">
        <CardContent className="space-y-6 px-6 py-8 text-center">
          <div className="space-y-2">
            <h1 className="font-press-start text-3xl text-balance text-foreground">{spot.name}</h1>
            <p className="text-xl text-pretty text-muted-foreground">{spot.description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-foreground/10 bg-background/60 p-4 text-left">
              <p className="text-sm uppercase tracking-wide text-muted-foreground">Location</p>
              <p className="text-xl text-foreground">{spot.location || "Unknown"}</p>
            </div>

            <div className="rounded-xl border border-foreground/10 bg-background/60 p-4 text-left">
              <p className="text-sm uppercase tracking-wide text-muted-foreground">Spot ID</p>
              <p className="truncate text-xl text-foreground">{spot.id}</p>
            </div>
          </div>

          <p className="text-base text-muted-foreground">
            Scan this QR page to register the spot in the user collection.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
