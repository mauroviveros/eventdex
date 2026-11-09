import { eventPhase } from "@/domain/events";
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

/** The platform at a glance. The pending total is per currency: pesos and dollars don't add up. */
export async function getPlatformSummary(supabase: Supabase, now = new Date()) {
  const [organizations, published, pending] = await Promise.all([
    supabase.from("organizations").select("status"),
    supabase
      .from("events")
      .select("status, schedules:event_schedules (starts_at, ends_at)")
      .eq("status", "published")
      .is("deleted_at", null),
    supabase
      .from("invoices")
      .select("amount_cents, currency")
      .eq("status", "pending"),
  ]);
  if (organizations.error) throw organizations.error;
  if (published.error) throw published.error;
  if (pending.error) throw pending.error;
  return {
    organizations: organizations.data.length,
    suspended: organizations.data.filter((o) => o.status === "suspended")
      .length,
    liveEvents: published.data.filter(
      (e) => eventPhase(e.status, e.schedules, now) === "en-curso",
    ).length,
    pendingInvoices: pending.data.length,
    pendingByCurrency: (["ARS", "USD"] as const).map((currency) => ({
      currency,
      cents: pending.data
        .filter((i) => i.currency === currency)
        .reduce((sum, i) => sum + i.amount_cents, 0),
    })),
  };
}

// shortcut: no pagination, PostgREST cuts at 1000 rows; page it past a few hundred invoices
/** Every invoice, newest first. */
export async function listInvoices(supabase: Supabase) {
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, concept, amount_cents, currency, status, issued_on, paid_at, organization:organizations (slug, name)",
    )
    .order("issued_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
