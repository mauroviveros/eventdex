import { supabase } from "@lib/supabase";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const { data } = await supabase.auth.getSession();
  return new Response(JSON.stringify(data.session), {
    status: 200,
    headers: { "Content-Type": "application/json", },
  });
}
