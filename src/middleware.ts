import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { applySecurityHeaders } from "@/lib/server/security-headers";
import { pruneRateLimitBuckets, rateLimitPost } from "@/lib/server/rate-limit";

export function middleware(request: NextRequest) {
  if (Math.random() < 0.01) {
    pruneRateLimitBuckets();
  }

  if (
    request.nextUrl.pathname.startsWith("/api/") &&
    request.method === "POST"
  ) {
    const rl = rateLimitPost(request);
    if (!rl.ok) {
      const res = NextResponse.json(
        { error: "Too many requests. Slow down." },
        { status: 429 },
      );
      applySecurityHeaders(res);
      return res;
    }
  }

  const res = NextResponse.next();
  applySecurityHeaders(res);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
