"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/lib/organizations";
import { requestOrigin, safeNext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

/** Where the provider sends the user back: this same host, so the cookie lands here. */
async function callbackUrl(next: string) {
  return `${requestOrigin(await headers())}/auth/callback?next=${encodeURIComponent(next)}`;
}

/** Starts Google sign-in. */
export async function signInWithGoogle(formData: FormData) {
  const next = safeNext(formData.get("next")?.toString());
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: await callbackUrl(next) },
  });
  if (error || !data.url) redirect("/ingresar?error=auth");
  redirect(data.url);
}

export type EmailSignInState = ActionResult<{ email: string }> | null;

/**
 * Development only: sign in with a magic link that lands in the local mail
 * viewer, so nobody needs Google credentials to work locally.
 * shortcut: dev-only email login, replace or remove if visitors get a non-Google method (PROYECTO, open question 1)
 */
export async function signInWithEmail(
  _prev: EmailSignInState,
  formData: FormData,
): Promise<EmailSignInState> {
  if (process.env.NODE_ENV === "production") {
    return { ok: false, error: "El ingreso por mail no está disponible." };
  }
  const email = z.email().safeParse(formData.get("email")?.toString().trim());
  if (!email.success) return { ok: false, error: "Revisá el mail." };

  const next = safeNext(formData.get("next")?.toString());
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: await callbackUrl(next) },
  });
  if (error) {
    console.error("email sign-in failed", error);
    return { ok: false, error: "No pudimos mandar el mail. Probá de nuevo." };
  }
  return { ok: true, data: { email: email.data } };
}
