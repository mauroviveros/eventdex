import type { Supabase } from "@/lib/supabase/server";

/**
 * Starts Google sign-in and returns where to send the browser: Google, which
 * comes back to /auth/callback on this same host (so the cookie lands here) and
 * then to `next`; or /ingresar with the error if the provider fails.
 * `next` must already be checked with safeNext.
 */
export async function googleSignInUrl(
  supabase: Supabase,
  origin: string,
  next: string,
): Promise<string> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error || !data.url) {
    if (error) console.error("google sign-in failed", error);
    return `/ingresar?error=auth&next=${encodeURIComponent(next)}`;
  }
  return data.url;
}
