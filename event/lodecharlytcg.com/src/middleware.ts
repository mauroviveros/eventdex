import { createClient } from "@/libs/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

// const protected_routes = ["/perfil"]
const REGEX_PROTECTED_PATHS = [/^\/perfil$/]

const shouldSkipAuth = (path: string) => {
  const isPathProtected = REGEX_PROTECTED_PATHS.some(regex => regex.test(path));
  return !isPathProtected;
}


export async function middleware(request: NextRequest) {
  if (shouldSkipAuth(request.nextUrl.pathname)) return NextResponse.next()

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
  matcher: [
    /*
     * Match todas las rutas excepto las de:
     * - api (ruta API)
     * - _next/static (archivos estáticos)
     * - _next/image (archivos de imagen)
     * - favicon.ico (favicon)
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico).*)",
  ],
}
