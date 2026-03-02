import { type NextRequest, NextResponse } from "next/server";
import { music } from "@/lib/music";

/**
 * GET /api/suggestions?id=<songId>
 *
 * Returns up-next / related songs for a given song via JioSaavn's suggestions endpoint.
 * Used to power autoplay after a song ends.
 */

const cache = new Map<string, { data: any; ts: number }>();
const TTL = 30 * 60 * 1000; // 30 min

const clean = (s: string) =>
  (s ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"');

const toImage = (img: any) => ({
  quality: img?.quality ?? "",
  link: img?.link ?? img?.url ?? "/song-placeholder.webp",
});

const toDownload = (dl: any) => ({
  quality: dl?.quality ?? "",
  link: dl?.link ?? dl?.url ?? "",
});

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ suggestions: [] });
  }

  const cached = cache.get(id);
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const { data } = await music.get(`/songs/${id}/suggestions`);
    const raw = data?.data ?? [];

    const suggestions = (Array.isArray(raw) ? raw : []).map((s: any) => ({
      id: s.id ?? "",
      name: clean(s.title ?? s.name ?? ""),
      type: s.type ?? "song",
      album: s.album ?? { id: "", name: "", url: "" },
      duration: String(s.duration ?? ""),
      primaryArtists:
        s.primaryArtists ?? s.artists?.primary?.map((a: any) => a.name).join(", ") ?? "",
      image: s.image?.map(toImage) ?? [],
      downloadUrl: s.downloadUrl?.map(toDownload) ?? [],
      language: s.language ?? "",
      url: s.url ?? "",
    }));

    const result = { suggestions };
    cache.set(id, { data: result, ts: Date.now() });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/suggestions]", err);
    return NextResponse.json({ suggestions: [] });
  }
}
