import type { Supabase } from "@/lib/supabase/server";

/** Where the provider sends the user back: this same host, so the cookie lands here. */
export function callbackUrl(origin: string, next: string) {
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

/**
 * Where a failed sign-in lands (`next` already checked with safeNext): a QR
 * goes back to its locked medal, so the visitor keeps the stand in front of
 * them; anything else to /ingresar, which keeps where it was going.
 */
export function signInErrorUrl(next: string) {
  if (next.startsWith("/s/")) {
    const url = new URL(next, "http://same.invalid");
    url.searchParams.set("error", "auth");
    return url.pathname + url.search;
  }
  return `/ingresar?error=auth&next=${encodeURIComponent(next)}`;
}

/**
 * Starts Google sign-in and returns where to send the browser: Google, which
 * comes back to /auth/callback and then to `next`; or signInErrorUrl if the
 * provider fails. `next` must already be checked with safeNext.
 */
export async function googleSignInUrl(
  supabase: Supabase,
  origin: string,
  next: string,
): Promise<string> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(origin, next) },
  });
  if (error || !data.url) {
    console.error("google sign-in failed", error ?? "no provider url");
    return signInErrorUrl(next);
  }
  return data.url;
}
