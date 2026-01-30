import { supabase } from "@lib/supabase";
import type { APIRoute } from "astro";

export const prerender = false;
export const GET: APIRoute = async ({ cookies }) => {
  const { data } = await supabase.auth.setSession({
    access_token: cookies.get("sb-access-token")?.value || "",
    refresh_token: cookies.get("sb-refresh-token")?.value || "",
  });
  return new Response(JSON.stringify(data.session), {
    status: 200,
    headers: { "Content-Type": "application/json", },
  });
}
