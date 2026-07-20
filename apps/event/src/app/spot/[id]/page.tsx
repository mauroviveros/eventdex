import { ArrowLeft, User as UserIcon } from "@nsmr/pixelart-react";
import { DateTime } from "luxon";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CelebrationConfetti } from "@/components/common/celebration-confetti";
import { Countdown } from "@/components/countdown";
import { LoginDialog } from "@/components/dialogs/login";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { serverEnv } from "@/config/env.server";
import { createClient } from "@/libs/supabase/server";
import { isScheduleActive, resolveScheduleDateTime } from "@/utils";

export default async function SpotQR({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: spot } = await supabase
    .from("event_spots")
    .select(`*, event:event_id(*)`)
    .eq("id", id)
    .eq("event.id", serverEnv.EVENTDEX_EVENT_ID)
    .maybeSingle();

  if (!spot?.event) notFound();

  const { data: schedules } = await supabase
    .from("event_schedules")
    .select("start_datetime, end_datetime")
    .eq("event_id", spot.event.id);

  const hasActiveSchedule = (schedules ?? []).some((schedule) =>
    isScheduleActive(schedule),
  );
  const firstScheduleStart = (schedules ?? [])
    .map((schedule) => resolveScheduleDateTime(schedule.start_datetime))
    .sort((left, right) => left.toMillis() - right.toMillis())[0];
  const eventHasNotStartedYet =
    !!firstScheduleStart && DateTime.utc() < firstScheduleStart;

  if (!hasActiveSchedule) {
    return (
      <section className="flex flex-col gap-4 min-h-[calc(100dvh-5rem)] items-center justify-center px-4 py-8">
        <Card className="highlight w-full max-w-2xl" variant="pixel">
          <CardContent className="flex flex-col items-center justify-center space-y-4 px-4 py-10 text-center">
            <h2 className="font-press-start text-2xl text-secondary">
              {eventHasNotStartedYet
                ? "El evento todavía no comenzó"
                : "El evento finalizo"}
            </h2>
            <p className="max-w-md text-lg text-muted-foreground">
              {eventHasNotStartedYet
                ? "Volvé más tarde para participar."
                : "¡Gracias por participar!"}
            </p>
            {eventHasNotStartedYet && (
              <Countdown
                start_datetime={(schedules ?? [])[0].start_datetime}
                initial={DateTime.now().toMillis()}
              />
            )}
          </CardContent>
        </Card>

        <div className="flex w-full flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/">
              <ArrowLeft className="size-5" />
              Volver al inicio
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/perfil">
              <UserIcon className="size-5" />
              Ir al perfil
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  const isLoggedIn = !!user;
  if (!isLoggedIn) return <LoginDialog open={true} />;

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
        collected_at: new Date().toISOString(),
      });

    justCollected = !insertError;
  }

  const avatar_url = supabase.storage
    .from("spot")
    .getPublicUrl(spot.avatar_path).data.publicUrl;

  return (
    <>
      <CelebrationConfetti trigger={justCollected} />
      <section className="flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center px-1 py-8">
        <Card className="highlight w-full max-w-2xl">
          <CardContent className="space-y-6 px-2 py-8 flex flex-col items-center justify-center">
            {!hasCollected && (
              <div className="space-y-2 text-center">
                <h2 className="font-press-start text-2xl text-secondary">
                  ¡Medalla obtenida!
                </h2>
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

        <div className="flex w-full flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/">
              <ArrowLeft className="size-5" />
              Volver al inicio
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/perfil">
              <UserIcon className="size-5" />
              Ir al perfil
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
