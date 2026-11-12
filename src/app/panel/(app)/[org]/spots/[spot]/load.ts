import { notFound } from "next/navigation";
import { cache } from "react";
import { z } from "zod";
import { getSpot } from "@/lib/data/spots";
import { requireOrg } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";

// Layout, metadata and page share one read per request.
export const load = cache(async (slug: string, id: string) => {
  const access = await requireOrg(slug);
  // Not a uuid can't be a spot; asking the database would be an error, not a 404.
  if (!z.guid().safeParse(id).success) notFound();
  const spot = await getSpot(await createClient(), access.org.id, id);
  if (!spot) notFound();
  return { ...access, spot };
});
