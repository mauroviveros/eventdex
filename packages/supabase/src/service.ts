import { createClient } from "@supabase/supabase-js";
import type { Database } from "@eventdex/database";

/**
 * Cliente Supabase con service-role: bypassa RLS.
 *
 * No usa cookies ni sesión de usuario (la service key no las necesita), así que
 * es un cliente plano sin dependencia del framework. Usar solo en contextos
 * server-side ya autorizados (p. ej. paneles de organizador).
 */
export function createServiceSupabase(url: string, serviceRoleKey: string) {
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
