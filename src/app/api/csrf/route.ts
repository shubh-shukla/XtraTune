import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/csrf";

/** GET /api/csrf – Returns a CSRF token for the client to attach to mutations */
export async function GET() {
  const { token } = await generateCsrfToken();
  return NextResponse.json({ csrfToken: token });
}
