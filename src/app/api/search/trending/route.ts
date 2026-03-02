import { NextResponse } from "next/server";
import { music } from "@/lib/music";

/**
 * GET /api/search/trending
 *
 * Returns a list of trending items (songs, artists, albums) from JioSaavn.
 * Results are cached in-memory for 30 minutes to reduce API load.
 */

let cache: { data: any; ts: number } | null = null;
const TTL = 30 * 60 * 1000; // 30 min

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json(cache.data);
  }

  const clean = (s: string) =>
    (s ?? "")
      .replace(/&amp;/g, "&")
      .replace(/&#039;/g, "'")
      .replace(/&quot;/g, '"');

  const toItem = (item: any) => ({
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
  });

  try {
    // Fetch from a well-known Hindi Trending playlist + a search for variety
    const [playlistRes, searchRes] = await Promise.allSettled([
      music.get("/playlists?id=1134543272&limit=10"),
      music.get("/search?query=trending+hindi"),
    ]);

    const trending: any[] = [];
    const seen = new Set<string>();

    const addItems = (items: any[] = []) => {
      for (const item of items) {
        if (trending.length >= 12) break;
        if (!item.id || seen.has(item.id)) continue;
        seen.add(item.id);
        trending.push(toItem(item));
      }
    };

    // Playlist songs first (real trending)
    if (playlistRes.status === "fulfilled") {
      const songs = playlistRes.value?.data?.data?.songs ?? [];
      addItems(songs);
    }

    // Fill remaining from search results (artists, albums mix)
    if (searchRes.status === "fulfilled") {
      const d = searchRes.value?.data?.data;
      addItems(d?.artists?.results ?? []);
      addItems(d?.albums?.results ?? []);
      addItems(d?.topQuery?.results ?? []);
    }

    const result = { trending };
    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (err) {
    console.error("[search/trending]", err);
    return NextResponse.json({ trending: [] });
  }
}
