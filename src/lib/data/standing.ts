import { raffleLink } from "@/domain/panelLink";
import type { Supabase } from "@/lib/supabase/server";

/**
 * The visitor's role in the organization's team, or null for a plain visitor.
 * A failed read throws: the caller decides what the page shows. Filtered by
 * user: the team reads each other's rows under RLS.
 */
export async function readRole(
  supabase: Supabase,
  organizationId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.role ?? null;
}

/** The first time the visitor registered in an event of the organization, or null if never. */
export async function readSince(
  supabase: Supabase,
  organizationId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("event_registrations")
    .select("created_at")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .order("created_at")
    .limit(1);
  if (error) throw error;
  return data[0]?.created_at ?? null;
}

/**
 * The link from the public app to the raffle of the organization's active
 * event, in the panel on the root domain; null if it has no active event.
 * Only for the team: it is the caller who checks the role first.
 */
export async function getRaffleHref(
  supabase: Supabase,
  organization: { id: string; slug: string },
  rootDomain: string,
) {
  const { data, error } = await supabase
    .rpc("active_event", { p_organization_id: organization.id })
    .select("slug")
    .maybeSingle();
  if (error) throw error;
  return data ? raffleLink(rootDomain, organization.slug, data.slug) : null;
}
