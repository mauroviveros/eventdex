import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/config/env";
import { serverEnv } from "@/config/env.server";
import type { Database } from "@/types";

/**
 * Cliente Supabase con service-role: bypassa RLS.
 *
 * No usa cookies ni sesión de usuario (la service key no las necesita), así que
 * es un cliente plano sin dependencia de `next/headers`. Usar solo en contextos
 * server-side ya autorizados (p. ej. paneles de organizador).
 */
export function createServiceClient() {
  return createSupabaseClient<Database>(
    env.SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
