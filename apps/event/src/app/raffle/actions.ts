"use server";

import { serverEnv } from "@/config/env.server";
import { createServiceClient } from "@/libs/supabase/service";
import { getCurrentUser, isOrganizer } from "@/server/auth";
import type { RaffleParticipant } from "@/types";

/**
 * Persiste el ganador de un sorteo recién realizado. Verifica que quien la llama
 * sea organizador (la UI ya está gateada, pero una server action es un endpoint
 * público). Append-only: cada sorteo agrega una fila.
 */
export async function saveRaffleWinner(winner: RaffleParticipant) {
  const user = await getCurrentUser();
  if (!user || !(await isOrganizer(user.id))) return;

  const service = createServiceClient();
  await service.from("raffle_winners").insert({
    event_id: serverEnv.EVENTDEX_EVENT_ID,
    user_id: winner.user_id,
    spot_count: winner.spot_count,
    drawn_by: user.id,
  });
}
