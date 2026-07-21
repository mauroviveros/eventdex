import { createServerSupabase } from "@eventdex/supabase/server";
import { cookies } from "next/headers";
import { env } from "@/config/env";

/** Cliente Supabase para Server Components: usa la publishable key y respeta RLS. */
export async function createClient() {
  // cookies() va primero: le señala a Next que la ruta es dinámica antes de
  // validar env, así el build no intenta prerenderizar páginas autenticadas.
  const cookieStore = await cookies();
  return createServerSupabase(
    env.SUPABASE_URL,
    env.SUPABASE_PUBLISHABLE_KEY,
    cookieStore,
  );
}
