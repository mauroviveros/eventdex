import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@eventdex/database";

/** Cliente Supabase para componentes cliente: usa la sesión del navegador. */
export function createBrowserSupabase(url: string, key: string) {
  return createBrowserClient<Database>(url, key);
}
