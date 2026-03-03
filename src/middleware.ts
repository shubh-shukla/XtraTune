import { type NextRequest, NextResponse } from "next/server";
import { validateCsrfToken } from "@/lib/csrf";
import { getSessionFromRequest } from "@/lib/session-edge";

/**
 * Middleware – runs on every matched route (Edge Runtime).
 *
 * 1. For mutating API routes (POST/PUT/DELETE under /api), validate CSRF token.
 * 2. Protected routes under /api/user/* require a valid session cookie.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  // ── CSRF check on mutating API calls ──────────
  // Read-only data-fetch routes that use POST are exempt.
  const csrfExempt = ["/api/auth", "/api/musicData", "/api/categories"];
  if (pathname.startsWith("/api/") && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const exempt = csrfExempt.some((p) => pathname.startsWith(p));
    if (!exempt) {
      const csrfHeader = req.headers.get("x-csrf-token");
      if (!csrfHeader || !(await validateCsrfToken(csrfHeader))) {
        return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
      }
    }
  }

  // ── Auth guard for /api/user/* routes ─────────
  if (pathname.startsWith("/api/user/")) {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
