import { notFound } from "next/navigation";
import { cache } from "react";
import { getEventBySlug } from "@/lib/data/events";
import { requireOrg } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";

// Layout, metadata and page share one read per request.
export const load = cache(async (slug: string, evento: string) => {
  const access = await requireOrg(slug);
  const event = await getEventBySlug(
    await createClient(),
    access.org.id,
    evento,
  );
  if (!event) notFound();
  return { ...access, event };
});
