import { RaffleDrawer } from "@/components/raffle-drawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/libs/supabase/server";
import { createServiceClient } from "@/libs/supabase/service";
import { notFound } from "next/navigation";

export default async function RafflePage() {
  if (!process.env.EVENTDEX_EVENT_ID) {
    throw new Error("Missing event id environment variable");
  }

  const service = await createServiceClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Verificar si el usuario es admin
  if (!user) return notFound();

  const { data: organizationMember } = await service
    .from("organization_members")
    .select("user_id, role")


  if (organizationMember?.find(({ user_id}) => user_id === user.id) === undefined) {
    return notFound();
  }

  // Obtener todos los user_spot_history del evento actual con datos del usuario
  const { data: histories, error } = await service
    .from("user_spot_history")
    .select(
      `
      user_id,
      spot:event_spots(id, event_id)
    `,
      { count: "exact" }
    )
    .eq("spot.event_id", process.env.EVENTDEX_EVENT_ID)

  // Agrupar por usuario y contar spots
  const participantMap = new Map<string, { spot_count: number }>();

  (histories ?? []).forEach((history) => {
    if (history.user_id) {
      const current = participantMap.get(history.user_id) || { spot_count: 0 };
      current.spot_count += 1;
      participantMap.set(history.user_id, current);
    }
  });

  // Convertir participantes a array con datos de usuario
  const participants = await Promise.all(
    Array.from(participantMap.entries())
      .map(async ([userId, data]) => {
        const { data: { user: authUser } } = await service.auth.admin.getUserById(userId);
        return {
          user_id: userId,
          user_email: authUser?.email ?? "email desconocido",
          user_name: authUser?.user_metadata?.full_name ?? authUser?.email ?? "Usuario Anónimo",
          user_avatar: authUser?.user_metadata?.avatar_url ?? "",
          spot_count: data.spot_count,
        };
      })
  )
    .then((p) => p
      .filter(({ spot_count }) => spot_count > 0)
      .filter(({ user_id }) => !organizationMember?.find((orgMember) => orgMember.user_id === user_id) ));


  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-press-start text-3xl text-center">Sorteo del Evento</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-2">
            <p className="text-lg">Total de participantes: <span className="font-bold text-secondary">{participants.length}</span></p>
            <p className="text-lg">Total de spots coleccionados: <span className="font-bold text-secondary">{participants.reduce((sum, p) => sum + p.spot_count, 0)}</span></p>
          </CardContent>
        </Card>

        <RaffleDrawer participants={participants} />
      </div>
    </div>
  );
}
