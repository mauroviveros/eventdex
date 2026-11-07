import type { Supabase } from "@/lib/supabase/server";

/**
 * Reads for the admin screens. RLS decides what each user gets; these functions only
 * shape the query. A failed read throws, so the segment's error.tsx shows it.
 */

export async function isDeveloper(supabase: Supabase, userId: string) {
  const { data, error } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

/** Organizations the user belongs to, with their role. */
export async function listMyOrganizations(supabase: Supabase, userId: string) {
  const { data, error } = await supabase
    .from("organization_members")
    .select("role, organization:organizations (id, slug, name, status)")
    .eq("user_id", userId)
    .order("created_at");
  if (error) throw error;
  return data.flatMap(({ role, organization }) =>
    organization ? [{ ...organization, role }] : [],
  );
}

/**
 * Accepts every open invitation for the signed-in account's email, so an
 * invited owner lands straight in their organization. Safe to call on every visit.
 */
export async function acceptMyInvitations(supabase: Supabase) {
  const { error } = await supabase.rpc("accept_my_invitations");
  if (error) throw error;
}

/** One organization by slug, or null if it doesn't exist or RLS hides it. */
export async function getOrganizationBySlug(supabase: Supabase, slug: string) {
  const { data, error } = await supabase
    .from("organizations")
    .select("id, slug, name, status")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Developer opening an organization that isn't theirs: leaves a support.viewed audit row. */
export async function logSupportAccess(
  supabase: Supabase,
  organizationId: string,
) {
  const { error } = await supabase.rpc("log_support_access", {
    p_organization_id: organizationId,
  });
  if (error) throw error;
}

/** Developer: every organization with its primary domain, team size and open invitations. */
export async function listAllOrganizations(supabase: Supabase) {
  const { data, error } = await supabase
    .from("organizations")
    .select(
      `id, slug, name, status, created_at,
       domains:organization_domains (hostname, is_primary),
       members:organization_members (count),
       invitations:organization_invitations (email, accepted_at)`,
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((org) => ({
    id: org.id,
    slug: org.slug,
    name: org.name,
    status: org.status,
    hostname: org.domains.find((d) => d.is_primary)?.hostname ?? null,
    members: org.members[0]?.count ?? 0,
    pendingInvitations: org.invitations
      .filter((i) => i.accepted_at === null)
      .map((i) => i.email),
  }));
}
