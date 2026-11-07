import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { internalPath, surfaceFor } from "@/lib/surface";

/**
 * Two jobs on every request:
 * 1. Rewrite the path to the surface the host serves (landing, admin, publica).
 * 2. Refresh the Supabase session, so Server Components read a valid token.
 */
export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? env.NEXT_PUBLIC_ROOT_DOMAIN;
  const surface = surfaceFor(host, env.NEXT_PUBLIC_ROOT_DOMAIN);
  const url = request.nextUrl.clone();
  url.pathname = internalPath(surface, request.nextUrl.pathname);

  let response = NextResponse.rewrite(url, { request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(toSet, headers) {
          // The refreshed token goes to Server Components (request) and to the browser (response).
          for (const { name, value } of toSet) request.cookies.set(name, value);
          response = NextResponse.rewrite(url, { request });
          for (const { name, value, options } of toSet) {
            response.cookies.set(name, value, options);
          }
          // Never cache a response that sets a session cookie.
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  // Verifies the token and refreshes it when close to expiry. Nothing may run in between.
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  // Shared routes (auth, dev), Next internals and static files skip the proxy.
  // robots.txt and sitemap.xml do go through it: they are per host.
  matcher: [
    "/((?!_next/|auth/|dev/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
