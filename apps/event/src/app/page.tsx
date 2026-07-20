import { serverEnv } from "@/config/env.server";
import { createClient } from "@/libs/supabase/server";
import type { Event } from "@/types";
import PageUpcoming from "./_components/status/upcoming";

export default async function Home() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select("*, location:event_locations(*), schedules:event_schedules(*)")
    .eq("id", serverEnv.EVENTDEX_EVENT_ID)
    .single();

  if (error) throw error;
  const event = data as Event;

  return <PageUpcoming event={event} />;
}
