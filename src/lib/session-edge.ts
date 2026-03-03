/**
 * Edge-runtime-compatible session helpers (used by middleware).
 * Uses `jose` instead of Node.js-only `jsonwebtoken`.
 */
import { jwtVerify } from "jose";
import { type NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!;
const COOKIE_NAME = "xt_session";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  image?: string;
  provider: string;
}

/** Read & verify session from a NextRequest (middleware – Edge Runtime) */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
