import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/config/env";
import type { Database } from "@/types";

/**
 * Cliente Supabase sin cookies, para datos públicos (evento, ubicación, horarios).
 *
 * Al no leer cookies no fuerza el render dinámico: permite cachear el fetch y
 * usarlo desde `generateMetadata`. Solo debe usarse para datos que cualquier
 * visitante puede ver (respaldado por RLS con la publishable key).
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_PUBLISHABLE_KEY,
  );
}
