import { type CookieOptions, createServerClient } from "@supabase/ssr";
import type { Database } from "@eventdex/database";

/**
 * Subconjunto del cookie store de Next (`await cookies()`) que necesita el
 * cliente. Se tipa estructuralmente para que el paquete no dependa de `next`.
 */
export interface CookieStore {
  getAll(): { name: string; value: string }[];
  set(name: string, value: string, options?: CookieOptions): void;
}

/**
 * Crea un cliente Supabase server-side cableado a un cookie store.
 *
 * `key` define el nivel de acceso:
 * - publishable → respeta las políticas RLS (uso normal, con sesión de usuario).
 * - service-role → bypassa RLS; reservado para operaciones administrativas.
 *
 * Centraliza el adaptador de cookies que antes estaba duplicado en cada app.
 */
export function createServerSupabase(
  url: string,
  key: string,
  cookieStore: CookieStore,
) {
  return createServerClient<Database>(url, key, {
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
