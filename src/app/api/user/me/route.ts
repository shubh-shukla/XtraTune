import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

/**
 * GET /api/user/me
 * Returns the current session user info (from httpOnly cookie).
 */
export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: session });
}
