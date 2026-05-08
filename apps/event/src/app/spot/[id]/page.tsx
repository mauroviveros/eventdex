import { CelebrationConfetti } from "@/components/common/celebration-confetti";
import { LoginDialog } from "@/components/dialogs/login";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/libs/supabase/server";
import { isScheduleActive } from "@/utils";
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function SpotQR({ params }: { params: Promise<{ id: string }> }) {
  if(!process.env.EVENTDEX_EVENT_ID) {
    throw new Error("Missing event id environment variable");
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: spot } = await supabase
    .from("event_spots")
    .select(`*, event:event_id(*)`)
    .eq("id", id)
    .eq("event.id", process.env.EVENTDEX_EVENT_ID)
    .maybeSingle();

  if (!spot || !spot.event) notFound();

  const { data: schedules } = await supabase
    .from("event_schedules")
    .select("start_datetime, end_datetime")
    .eq("event_id", spot.event.id);

  const hasActiveSchedule = (schedules ?? []).some((schedule) => isScheduleActive(schedule));

  if (!hasActiveSchedule) {
    return (
      <section className="flex min-h-[calc(100dvh-5rem)] items-center justify-center px-4 py-8">
        <Card className="highlight w-full max-w-2xl" variant="pixel">
          <CardContent className="flex flex-col items-center justify-center space-y-4 px-4 py-10 text-center">
            <h2 className="font-press-start text-2xl text-secondary">El evento finalizo</h2>
            <p className="max-w-md text-lg text-muted-foreground">¡Gracias por participar!</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  const isLoggedIn = !!user;
  if (!isLoggedIn) return <LoginDialog open={true} />

  const { data: history, error } = await supabase
    .from("user_spot_history")
    .select("id")
    .eq("user_id", user.id)
    .eq("spot_id", spot.id)
    .maybeSingle();

  const hasCollected = !!history;
  let justCollected = false;

  if (!hasCollected && !error) {
    const { error: insertError } = await supabase
      .from("user_spot_history")
      .insert({
        user_id: user.id,
        spot_id: spot.id,
        collected_at: new Date().toISOString()
      });

    justCollected = !insertError;
  }

  const avatar_url = supabase.storage.from("spot").getPublicUrl(spot.avatar_path).data.publicUrl;

  return (
    <>
      <CelebrationConfetti trigger={justCollected} />
      <section className="flex min-h-[calc(100dvh-5rem)] items-center justify-center px-1 py-8"> {/* px-4 pokecard */}
        <Card className="highlight w-full max-w-2xl">
          <CardContent className="space-y-6 px-2 py-8 flex flex-col items-center justify-center">
            {!hasCollected && (
              <div className="space-y-2 text-center">
                <h2 className="font-press-start text-2xl text-secondary">¡Medalla obtenida!</h2>
              </div>
            )}

            <picture className="size-32 flex items-center justify-center pixel-border-sm bg-linear-to-br from-medal-gold to-accent medal-glow">
              <Image
                src={avatar_url}
                alt={spot.name}
                width={128}
                height={128}
                className="size-full opacity-85"
                loading="eager"
                decoding="async"
              />
            </picture>

            <p className="font-press-start text-sm text-center text-foreground max-w-56 word-break">
              {spot.name}
            </p>
          </CardContent>
        </Card>
      </section>
    </>

  );
}
