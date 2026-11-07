import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getSessionUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isDeveloper } from "./organizations";

/**
 * Who is looking at this request, resolved once per request (layouts, pages
 * and generateMetadata share it). Null without a session.
 */
export const getViewer = cache(async () => {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) return null;
  return { ...user, isDeveloper: await isDeveloper(supabase, user.id) };
});

/**
 * The viewer, or a redirect to /ingresar that comes back to this page.
 * Every guarded layout calls it: Next renders nested layouts in parallel, so
 * relying on a parent layout's redirect lets a child's notFound() win.
 */
export async function requireViewer() {
  const viewer = await getViewer();
  if (viewer) return viewer;
  const next = (await headers()).get("x-public-path") ?? "/";
  redirect(`/ingresar?next=${encodeURIComponent(next)}`);
}

/**
 * Metadata for platform pages: a title only for the developer, so the 404
 * everyone else gets doesn't reveal that the route exists.
 */
export async function platformMetadata(title: string) {
  return (await getViewer())?.isDeveloper ? { title } : {};
}
