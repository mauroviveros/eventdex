import type { NextRequest } from "next/server";
import { handleSignIn } from "../../_utils/signin";

export async function GET(request: NextRequest) {
  return handleSignIn(request, { redirectTo: "/api/auth/admin/callback" });
}

export async function POST(request: NextRequest) {
  return handleSignIn(request, { redirectTo: "/api/auth/admin/callback" });
}
