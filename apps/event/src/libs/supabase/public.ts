import { createPublicSupabase } from "@eventdex/supabase/public";
import { env } from "@/config/env";

/** Cliente sin cookies para datos públicos (evento, ubicación, horarios). */
export function createPublicClient() {
  return createPublicSupabase(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY);
}
