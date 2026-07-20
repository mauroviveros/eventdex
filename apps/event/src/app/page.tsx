import { createClient } from "@/libs/supabase/server";
import type { Event } from "@/types";
import PageUpcoming from "./_components/status/upcoming";

export default async function Home() {
  const supabase = await createClient();

  if (!process.env.EVENTDEX_ORGANIZATION_ID || !process.env.EVENTDEX_EVENT_ID) {
    throw new Error("Missing organization id or event id environment variable");
  }

  const { data, error } = await supabase
    .from("events")
    .select("*, location:event_locations(*), schedules:event_schedules(*)")
    .eq("id", process.env.EVENTDEX_EVENT_ID)
    .single();

  if (error) throw error;
  const event = data as Event;

  return <PageUpcoming event={event} />;
}
