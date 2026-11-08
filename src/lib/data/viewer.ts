import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { getSessionUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import {
  getOrganizationBySlug,
  isDeveloper,
  listMyOrganizations,
} from "./organizations";

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

/**
 * The organization of an admin page and how the viewer is in it, once per
 * request (the layout and its pages share it). A member works in it; the
 * developer who isn't one is in read-only support mode; anyone else gets 404.
 */
export const requireOrg = cache(async (slug: string) => {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const [org, mine] = await Promise.all([
    getOrganizationBySlug(supabase, slug),
    listMyOrganizations(supabase, viewer.id),
  ]);
  const membership = mine.find((m) => m.slug === slug);
  if (!org || (!membership && !viewer.isDeveloper)) notFound();
  return { viewer, org, mine, role: membership?.role, support: !membership };
});

/**
 * The signed-in visitor as the public header shows them: name, mail and
 * photo from their profile. Null without a session. No developer check: the
 * public app never needs it.
 */
export const getVisitorAccount = cache(async () => {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("email, full_name, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  const email = data?.email ?? user.email ?? "";
  return {
    id: user.id,
    email,
    name: data?.display_name || data?.full_name || email,
    avatarUrl: data?.avatar_url ?? null,
  };
});
