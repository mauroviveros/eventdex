"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

/** Starts Google sign-in. The callback lands on this same host, so the cookie is set here. */
export async function signInWithGoogle(formData: FormData) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const next = safeNext(formData.get("next")?.toString());

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${proto}://${host}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) redirect("/ingresar?error=auth");
  redirect(data.url);
}
