import { DateTime } from "luxon";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { getEventSchedules } from "@/server/events";
import { collectMedal, getEventSpot } from "@/server/spots";
import { isScheduleActive, resolveScheduleDateTime } from "@/utils";
import { LoginDialog } from "./_components/login-dialog";
import { SpotClaimed } from "./_components/spot-claimed";
import { SpotInactive } from "./_components/spot-inactive";

export default async function SpotQR({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, spot] = await Promise.all([getCurrentUser(), getEventSpot(id)]);

  if (!spot?.event) notFound();

  const schedules = await getEventSchedules(spot.event.id);
  const hasActiveSchedule = schedules.some((schedule) =>
    isScheduleActive(schedule),
  );

  if (!hasActiveSchedule) {
    const firstScheduleStart = schedules
      .map((schedule) => resolveScheduleDateTime(schedule.start_datetime))
      .sort((left, right) => left.toMillis() - right.toMillis())[0];
    const eventHasNotStartedYet =
      !!firstScheduleStart && DateTime.utc() < firstScheduleStart;

    return (
      <SpotInactive
        eventHasNotStartedYet={eventHasNotStartedYet}
        startDatetime={schedules[0]?.start_datetime}
      />
    );
  }

  // El evento está activo pero solo se puede reclamar la medalla con sesión.
  if (!user) return <LoginDialog open={true} />;

  const { alreadyCollected, justCollected } = await collectMedal(
    user.id,
    spot.id,
  );

  return (
    <SpotClaimed
      name={spot.name}
      avatarUrl={spot.avatar_url}
      alreadyCollected={alreadyCollected}
      justCollected={justCollected}
    />
  );
}
