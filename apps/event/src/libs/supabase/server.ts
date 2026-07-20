import { env } from "@/config/env";
import { createServerSupabase } from "./factory";

/** Cliente Supabase para Server Components: usa la publishable key y respeta RLS. */
export function createClient() {
  return createServerSupabase(env.SUPABASE_PUBLISHABLE_KEY);
}
