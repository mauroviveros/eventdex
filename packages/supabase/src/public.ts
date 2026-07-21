import { createClient } from "@supabase/supabase-js";
import type { Database } from "@eventdex/database";

/**
 * Cliente Supabase sin cookies, para datos públicos.
 *
 * Al no leer cookies no fuerza el render dinámico: permite cachear el fetch y
 * usarlo desde `generateMetadata`. Solo debe usarse para datos que cualquier
 * visitante puede ver (respaldado por RLS con la publishable key).
 */
export function createPublicSupabase(url: string, key: string) {
  return createClient<Database>(url, key);
}
