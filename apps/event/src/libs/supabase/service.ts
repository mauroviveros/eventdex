import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/config/env";
import { serverEnv } from "@/config/env.server";
import type { Database } from "@/types";

export async function createServiceClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
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
            // Server Components can read cookies but cannot persist updates.
          }
        },
      },
    },
  );
}
