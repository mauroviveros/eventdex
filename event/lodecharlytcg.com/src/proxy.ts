import { createClient } from "@/libs/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

export default async function proxy(request: NextRequest) {
  const { supabase, response } = createClient(request)
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    const redirectResponse = NextResponse.redirect(new URL("/", request.url))

    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie)
    }

    return redirectResponse
  }
  return response
}

export const config = {
  matcher: ["/perfil", "/perfil/:path*"],
}
