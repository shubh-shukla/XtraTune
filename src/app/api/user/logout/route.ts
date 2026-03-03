import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

/**
 * POST /api/user/logout
 * Clears the httpOnly session cookie.
 * (NextAuth's own signOut should also be called client-side.)
 */
export async function POST() {
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
