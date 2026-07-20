import { notFound } from "next/navigation";
import { RaffleDrawer } from "@/components/raffle-drawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, isOrganizer } from "@/server/auth";
import { getRaffleParticipants } from "@/server/raffle";

export default async function RafflePage() {
  const user = await getCurrentUser();
  if (!user || !(await isOrganizer(user.id))) return notFound();

  const participants = await getRaffleParticipants();

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-press-start text-3xl text-center">
              Sorteo del Evento
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-2">
            <p className="text-lg">
              Total de participantes:{" "}
              <span className="font-bold text-secondary">
                {participants.length}
              </span>
            </p>
            <p className="text-lg">
              Total de spots coleccionados:{" "}
              <span className="font-bold text-secondary">
                {participants.reduce((sum, p) => sum + p.spot_count, 0)}
              </span>
            </p>
          </CardContent>
        </Card>

        <RaffleDrawer participants={participants} />
      </div>
    </div>
  );
}
