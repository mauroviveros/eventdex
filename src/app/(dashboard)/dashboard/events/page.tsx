import { createClient } from "@/lib/supabase/server";
import EventCard from "./_components/eventCard";

export default async function DashboardEventsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select("*");
  if (error) return null;
  const events = data ?? [];

  console.log(events);

  return (
    <>
      <hgroup className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Eventos</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona tus eventos presenciales, stands y la experiencia de los visitantes.
        </p>
      </hgroup>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </section>
    </>
  );
}
