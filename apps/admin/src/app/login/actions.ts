"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";

export const signInWithGoogle = async (next?: string) => {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "http://localhost:3001";
  const callback = new URL("/api/auth/callback", origin);
  callback.searchParams.set("next", next ?? "/");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() },
  });

  if (error) return redirect("/login?error=oauth_error");
  return redirect(data.url);
};

export const signOut = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/login");
};
