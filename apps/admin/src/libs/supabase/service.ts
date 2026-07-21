import { createServiceSupabase } from "@eventdex/supabase/service";
import { env } from "@/config/env";
import { serverEnv } from "@/config/env.server";

/**
 * Cliente con service-role (bypassa RLS). Es la vía para las queries org-wide
 * del dashboard: usarlo SOLO después de verificar la membresía del usuario
 * server-side (ver `getMembership` en `@/server/auth`).
 */
export function createServiceClient() {
  return createServiceSupabase(
    env.SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
  );
}
