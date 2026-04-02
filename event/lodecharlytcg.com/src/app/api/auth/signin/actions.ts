"use server";

import { createClient } from "@/libs/supabase/server";
import { cookies, headers } from 'next/headers';
import { redirect } from "next/navigation";

export const signInWithGoogle = async (next?: string) => {
  const supabase = await createClient(await cookies())
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const callback = new URL('/api/auth/callback', origin);
  callback.searchParams.set("next", next ?? "/");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() }
  });

  if (error) return redirect("/?error=oauth_error");
  return redirect(data.url);
}
