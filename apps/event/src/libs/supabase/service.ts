import { createServiceSupabase } from "@eventdex/supabase/service";
import { env } from "@/config/env";
import { serverEnv } from "@/config/env.server";

/** Cliente con service-role (bypassa RLS): solo en contextos ya autorizados. */
export function createServiceClient() {
  return createServiceSupabase(
    env.SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
  );
}
