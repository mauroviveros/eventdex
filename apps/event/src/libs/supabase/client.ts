import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/config/env";
import type { Database } from "@/types";

export function createClient() {
  return createBrowserClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_PUBLISHABLE_KEY,
  );
}
