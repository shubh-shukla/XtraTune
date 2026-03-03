import { NextResponse } from "next/server";
import { music } from "@/lib/music";

/**
 * GET /api/stations
 *
 * Returns curated radio-style stations by searching JioSaavn editorial playlists.
 * Groups results into categories: Mood, Genre, Decade, Artist.
 * Cached for 30 minutes.
 */

type StationCategory = {
  title: string;
  stations: {
    id: string;
    name: string;
    type: string;
    image: { quality: string; url: string }[];
    url: string;
    songCount: number;
    description: string;
  }[];
};

// Curated queries for each station category
const STATION_QUERIES: { category: string; queries: string[] }[] = [
  {
    category: "Mood Radio",
    queries: [
      "chill vibes hindi",
      "romantic mood",
      "feel good bollywood",
      "sad songs hindi",
      "party hits bollywood",
    ],
  },
  {
    category: "Genre Radio",
    queries: [
      "bollywood dance hits",
      "indie pop hindi",
      "sufi hits",
      "punjabi hits",
      "bollywood rock",
    ],
  },
  {
    category: "Decade Radio",
    queries: [
      "best of 90s hindi",
      "hindi 2000s hits",
      "retro bollywood",
      "chartbusters 2025 hindi",
      "80s hindi classics",
    ],
  },
  {
    category: "Artist Radio",
    queries: [
      "arijit singh love songs",
      "let's play shreya ghoshal",
      "let's play kishore kumar",
      "atif aslam hits",
      "a.r. rahman greatest",
    ],
  },
];

async function searchPlaylists(query: string, limit = 5) {
  try {
    const { data } = await music.get(
      `/search/playlists?query=${encodeURIComponent(query)}&limit=${limit}`,
    );
    return (data?.data?.results ?? []).map((p: any) => ({
      id: p.id,
      name: p.name ?? p.title ?? "",
      type: p.type ?? "playlist",
      image: (p.image ?? []).map((img: any) => ({
        quality: img.quality ?? "",
        link: img.link ?? img.url ?? "",
        url: img.url ?? img.link ?? "",
      })),
      url: p.url ?? "",
      songCount: Number(p.songCount ?? 0),
      description: p.description ?? p.subtitle ?? "",
    }));
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    // Fire all queries in parallel — one per station category query
    const allQueries = STATION_QUERIES.flatMap((cat) =>
      cat.queries.map((q) => ({ category: cat.category, query: q })),
    );

    const results = await Promise.all(allQueries.map(({ query }) => searchPlaylists(query, 3)));

    // Group results by category, pick the best (first) playlist per query
    const seenIds = new Set<string>();
    const categories: StationCategory[] = [];

    let resultIdx = 0;
    for (const cat of STATION_QUERIES) {
      const stations: StationCategory["stations"] = [];
      for (const _q of cat.queries) {
        const playlists = results[resultIdx++] ?? [];
        // Pick the first unseen playlist
        for (const p of playlists) {
          if (!seenIds.has(p.id) && p.name && p.image?.length > 0) {
            seenIds.add(p.id);
            stations.push(p);
            break;
          }
        }
      }
      if (stations.length > 0) {
        categories.push({ title: cat.category, stations });
      }
    }

    return NextResponse.json(
      { success: true, data: categories },
      {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
        },
      },
    );
  } catch (err) {
    console.error("[api/stations]", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch radio stations" },
      { status: 500 },
    );
  }
}
