import { serverEnv } from "@/config/env.server";
import { createServiceClient } from "@/libs/supabase/service";
import type { RaffleParticipant } from "@/types";
import { getOrganizerUserIds } from "./auth";

/**
 * Participantes del sorteo del evento actual: usuarios que coleccionaron al menos
 * un spot, con su cantidad, excluyendo a los organizadores.
 *
 * Usa la service key porque agrega datos de todos los usuarios (fuera del alcance
 * de RLS) y resuelve sus perfiles vía la Admin API.
 */
export async function getRaffleParticipants(): Promise<RaffleParticipant[]> {
  const service = createServiceClient();

  // 1. Spots que pertenecen al evento actual.
  const { data: eventSpots } = await service
    .from("event_spots")
    .select("id")
    .eq("event_id", serverEnv.EVENTDEX_EVENT_ID);

  const spotIds = (eventSpots ?? []).map((spot) => spot.id);
  if (spotIds.length === 0) return [];

  // 2. Cada fila de historial es un spot coleccionado; contamos por usuario.
  const { data: histories } = await service
    .from("user_spot_history")
    .select("user_id")
    .in("spot_id", spotIds);

  const spotCountByUser = new Map<string, number>();
  for (const { user_id } of histories ?? []) {
    if (!user_id) continue;
    spotCountByUser.set(user_id, (spotCountByUser.get(user_id) ?? 0) + 1);
  }

  // 3. Los organizadores no participan del sorteo.
  const organizerIds = new Set(await getOrganizerUserIds());

  // 4. Resolvemos el perfil de cada participante (Admin API) y armamos el DTO.
  return Promise.all(
    Array.from(spotCountByUser.entries())
      .filter(([userId, count]) => count > 0 && !organizerIds.has(userId))
      .map(async ([userId, spotCount]) => {
        const {
          data: { user },
        } = await service.auth.admin.getUserById(userId);
        return {
          user_id: userId,
          user_email: user?.email ?? "email desconocido",
          user_name:
            user?.user_metadata?.full_name ?? user?.email ?? "Usuario Anónimo",
          user_avatar: user?.user_metadata?.avatar_url ?? "",
          spot_count: spotCount,
        };
      }),
  );
}
