import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!;
const COOKIE_NAME = "xt_session";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  image?: string;
  provider: string;
}

/** Create a signed JWT */
export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: MAX_AGE });
}

/** Verify & decode a JWT – returns null on failure */
export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

/** Set httpOnly session cookie */
export function setSessionCookie(payload: SessionPayload) {
  const token = signToken(payload);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return token;
}

/** Remove session cookie */
export function clearSessionCookie() {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/** Read session from cookie jar (server components / route handlers) */
export function getSession(): SessionPayload | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export { COOKIE_NAME };
