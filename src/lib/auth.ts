import type { Supabase } from "@/lib/supabase/server";

/** Where the provider sends the user back: this same host, so the cookie lands here. */
export function callbackUrl(origin: string, next: string) {
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

/**
 * Starts Google sign-in and returns where to send the browser: Google, which
 * comes back to /auth/callback and then to `next`; or /ingresar with the error
 * if the provider fails. `next` must already be checked with safeNext.
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
    return `/ingresar?error=auth&next=${encodeURIComponent(next)}`;
  }
  return data.url;
}
