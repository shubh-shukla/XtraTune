import { type NextRequest, NextResponse } from "next/server";
import { music } from "@/lib/music";

/**
 * GET /api/lyrics?id=<songId>
 *
 * Fetches lyrics for a specific song from JioSaavn.
 * Returns { lyrics, snippet, copyright } or an empty object on failure.
 */

// Simple in-memory cache: songId → lyrics (persists across requests in the same server instance)
const cache = new Map<string, { data: any; ts: number }>();
const TTL = 60 * 60 * 1000; // 1 hour — lyrics don't change

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "Missing song id" }, { status: 400 });
  }

  // Check cache
  const cached = cache.get(id);
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const { data } = await music.get(`/songs/${id}/lyrics`);
    const raw = data?.data ?? data ?? {};

    const result = {
      lyrics: raw.lyrics ?? raw.text ?? "",
      snippet: raw.snippet ?? "",
      copyright: raw.copyright ?? "",
      hasLyrics: !!(raw.lyrics ?? raw.text),
    };

    cache.set(id, { data: result, ts: Date.now() });
    return NextResponse.json(result);
  } catch (_err: any) {
    // Many songs don't have lyrics — return gracefully
    const notFound = {
      lyrics: "",
      snippet: "",
      copyright: "",
      hasLyrics: false,
    };
    cache.set(id, { data: notFound, ts: Date.now() });
    return NextResponse.json(notFound);
  }
}
