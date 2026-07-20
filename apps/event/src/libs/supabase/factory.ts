import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/config/env";
import type { Database } from "@/types";

/**
 * Crea un cliente Supabase server-side cableado al store de cookies de Next.
 *
 * `key` define el nivel de acceso:
 * - publishable → respeta las políticas RLS (uso normal, con sesión de usuario).
 * - service-role → bypassa RLS; reservado para operaciones administrativas.
 *
 * Centraliza el adaptador de cookies que antes estaba duplicado en cada cliente.
 */
export async function createServerSupabase(key: string) {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.SUPABASE_URL, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Los Server Components pueden leer cookies pero no persistir cambios;
          // el refresh de sesión ocurre en el flujo que sí puede escribirlas.
        }
      },
    },
  });
}
