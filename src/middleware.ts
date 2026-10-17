import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.nextUrl.searchParams.get("session");
  if (!session) return NextResponse.next();

  const headers = new Headers(request.headers);
  const existing = headers.get("cookie");
  const pair = `session=${session}`;
  headers.set("cookie", existing ? `${existing}; ${pair}` : pair);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/dashboard", "/groups", "/team", "/reports", "/settings", "/projects/:path*"],
};
