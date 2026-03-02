import { type NextRequest, NextResponse } from "next/server";
import { music } from "@/lib/music";

/**
 * GET /api/search/results?q=<query>
 *
 * Returns full search results (more items than suggestions) from JioSaavn.
 */

const clean = (s: string) =>
  (s ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"');

const toImage = (img: any) => ({
  quality: img?.quality ?? "",
  link: img?.link ?? img?.url ?? "",
});

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({
      data: {
        topResult: { results: [] },
        albums: { results: [] },
        songs: { results: [] },
        artists: { results: [] },
        playlists: { results: [] },
      },
    });
  }

  try {
    const { data } = await music.get(`/search?query=${encodeURIComponent(q)}`);

    const mapItems = (items: any[] = [], limit = 20) =>
      items.slice(0, limit).map((item) => ({
        id: item.id || "",
        title: clean(item.title ?? item.name ?? ""),
        type: item.type ?? "song",
        image: item.image?.map(toImage) ?? [],
        description: clean(item.description ?? item.primaryArtists ?? item.artist ?? ""),
        url: item.url ?? "",
        album: clean(item.album ?? ""),
        year: item.year ?? "",
        language: item.language ?? "",
        primaryArtists: clean(
          item.primaryArtists ?? item.artists?.primary?.map((a: any) => a.name).join(", ") ?? "",
        ),
      }));

    return NextResponse.json({
      data: {
        topResult: { results: mapItems(data.data?.topQuery?.results, 5) },
        albums: { results: mapItems(data.data?.albums?.results, 20) },
        songs: { results: mapItems(data.data?.songs?.results, 20) },
        artists: { results: mapItems(data.data?.artists?.results, 20) },
        playlists: { results: mapItems(data.data?.playlists?.results, 20) },
      },
    });
  } catch (err) {
    console.error("[search/results]", err);
    return NextResponse.json({
      data: {
        topResult: { results: [] },
        albums: { results: [] },
        songs: { results: [] },
        artists: { results: [] },
        playlists: { results: [] },
      },
    });
  }
}
