import { serverEnv } from "@/config/env.server";
import { createPublicClient } from "@/libs/supabase/public";
import { createClient } from "@/libs/supabase/server";
import type { Event } from "@/types";

/**
 * Evento configurado para este deployment, con su ubicación y horarios.
 * Usa el cliente público (sin cookies) porque son datos públicos: así el fetch
 * es cacheable y sirve tanto al render de la landing como a `generateMetadata`.
 */
export async function getEvent(): Promise<Event> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("events")
    .select("*, location:event_locations(*), schedules:event_schedules(*)")
    .eq("id", serverEnv.EVENTDEX_EVENT_ID)
    .single();

  if (error) throw error;
  return data as Event;
}

/** Horarios (inicio/fin) de un evento. */
export async function getEventSchedules(eventId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_schedules")
    .select("start_datetime, end_datetime")
    .eq("event_id", eventId);
  return data ?? [];
}
