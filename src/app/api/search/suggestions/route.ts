import { type NextRequest, NextResponse } from "next/server";
import { music } from "@/lib/music";

/**
 * GET /api/search/suggestions?q=<query>
 *
 * Returns categorized search suggestions from JioSaavn:
 *   { topResult, albums, songs, artists, playlists }
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({
      topResult: [],
      albums: [],
      songs: [],
      artists: [],
      playlists: [],
    });
  }

  try {
    const { data } = await music.get(`/search?query=${encodeURIComponent(q)}`);

    const clean = (s: string) =>
      (s ?? "")
        .replace(/&amp;/g, "&")
        .replace(/&#039;/g, "'")
        .replace(/&quot;/g, '"');

    const mapItems = (items: any[] = [], limit = 4) =>
      items.slice(0, limit).map((item) => ({
        id: item.id || "",
        title: clean(item.title ?? item.name ?? ""),
        type: item.type ?? "song",
        image:
          item.image?.[1]?.url ??
          item.image?.[1]?.link ??
          item.image?.[0]?.url ??
          item.image?.[0]?.link ??
          "",
        description: clean(item.description ?? item.primaryArtists ?? item.artist ?? ""),
      }));

    return NextResponse.json({
      topResult: mapItems(data.data?.topQuery?.results, 3),
      albums: mapItems(data.data?.albums?.results, 4),
      songs: mapItems(data.data?.songs?.results, 4),
      artists: mapItems(data.data?.artists?.results, 4),
      playlists: mapItems(data.data?.playlists?.results, 3),
    });
  } catch (err) {
    console.error("[search/suggestions]", err);
    return NextResponse.json({
      topResult: [],
      albums: [],
      songs: [],
      artists: [],
      playlists: [],
    });
  }
}
