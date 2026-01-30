import type { APIRoute } from "astro";
import { supabase } from "@lib/supabase";
export const prerender = false;

// Endpoint para iniciar el proceso de autenticación OAuth
export const POST: APIRoute = async ({ request, redirect, url }) => {
  const formData = await request.formData();
  const provider = formData.get("provider")?.toString();

  if (provider !== "google") return new Response("Unsupported provider", { status: 400 });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: new URL('/api/auth/callback', url.origin).toString()
    },
  });

  if (error) return new Response(error.message, { status: 500 });
  return redirect(data.url);
}
