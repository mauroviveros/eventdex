import type { Supabase } from "@/lib/supabase/server";

export type SessionUser = { id: string; email: string | null };

/**
 * The signed-in user, verified from the JWT (getClaims), or null.
 * Use it to decide redirects; authorization itself is RLS.
 */
export async function getSessionUser(
  supabase: Supabase,
): Promise<SessionUser | null> {
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
  };
}

/**
 * `next` from a query string, only if it is a path on this same host.
 * Anything else (another host, `//evil.com`) falls back, so the auth flow
 * can't be used as an open redirect.
 */
export function safeNext(next: string | null | undefined, fallback = "/") {
  if (
    !next?.startsWith("/") ||
    next.startsWith("//") ||
    next.startsWith("/\\")
  ) {
    return fallback;
  }
  return next;
}

/**
 * The origin the browser actually used (`http://app.localhost:3000`), from the
 * forwarded headers. Next's request.nextUrl.origin reports the server's own
 * host, which breaks the per-host redirects of the auth flow.
 */
export function requestOrigin(headers: Headers) {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const proto = headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
