import type { AuditFilter } from "@/lib/platform";
import type { Supabase } from "@/lib/supabase/server";

const AUDIT_PAGE_SIZE = 50;

/** One page of the audit log, newest first. RLS limits it to the developer and each org's owner. */
export async function listAuditLogs(
  supabase: Supabase,
  { org, area, pagina }: AuditFilter,
) {
  const from = (pagina - 1) * AUDIT_PAGE_SIZE;
  let query = supabase.from("audit_logs").select(
    `id, action, entity_type, entity_id, diff, created_at,
     organization:organizations (slug, name),
     actor:profiles (email, full_name)`,
  );
  if (org) query = query.eq("organization_id", org);
  if (area) query = query.like("action", `${area}.%`);

  // One row more than the page: tells if there is a next one without counting.
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + AUDIT_PAGE_SIZE);
  if (error) throw error;
  return {
    rows: data.slice(0, AUDIT_PAGE_SIZE),
    hasMore: data.length > AUDIT_PAGE_SIZE,
  };
}
