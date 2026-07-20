import { serverEnv } from "@/config/env.server";
import { createServerSupabase } from "./factory";

/**
 * Cliente Supabase con service-role: bypassa RLS.
 * Usar solo en contextos server-side ya autorizados (p. ej. paneles de organizador).
 */
export function createServiceClient() {
  return createServerSupabase(serverEnv.SUPABASE_SERVICE_ROLE_KEY);
}
