import { NextResponse } from "next/server";
import { gethomepageData } from "@/utils/get-home-data";

/**
 * GET /api/trending
 *
 * Returns the full homepage payload (trending songs, albums, charts,
 * playlists) using the same curated-playlist strategy as the web SSR
 * homepage.  Cached inside gethomepageData() already.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const homepage = await gethomepageData();
    if (!homepage?.data) {
      return NextResponse.json(
        { songs: [], albums: [], charts: [], playlists: [], trending: { songs: [], albums: [] } },
        { status: 200 },
      );
    }
    return NextResponse.json(homepage.data);
  } catch (err) {
    console.error("[api/trending]", err);
    return NextResponse.json(
      { songs: [], albums: [], charts: [], playlists: [], trending: { songs: [], albums: [] } },
      { status: 200 },
    );
  }
}
