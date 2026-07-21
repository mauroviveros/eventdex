import { createBrowserSupabase } from "@eventdex/supabase/browser";
import { env } from "@/config/env";

export function createClient() {
  return createBrowserSupabase(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY);
}
