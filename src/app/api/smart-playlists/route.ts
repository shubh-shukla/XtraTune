import { NextResponse } from "next/server";
import { generateSmartPlaylists } from "@/lib/ai/prompts/smart-playlists";
import clientPromise from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { gethomepageData } from "@/utils/get-home-data";
import type { ListeningHistoryDoc, SmartPlaylistsDoc } from "@/lib/db-schema";

const TTL_DAYS = 7;

const guestFallback = async () => {
  const home = await gethomepageData();
  return NextResponse.json({
    source: "guest",
    playlists: (home?.data.playlists ?? []).slice(0, 4).map((p: any) => ({
      name: p.title,
      description: p.subtitle ?? "",
      theme: "trending",
      songIds: [],
      image: p.image,
    })),
  });
};

export async function GET() {
  const session = getSession();
  if (!session) return guestFallback();

  const client = await clientPromise;
  const db = client.db();

  const cached = await db
    .collection<SmartPlaylistsDoc>("smart_playlists")
    .findOne({ userId: session.userId });
  const fresh =
    cached && Date.now() - new Date(cached.generatedAt).getTime() < TTL_DAYS * 24 * 60 * 60 * 1000;
  if (fresh) {
    return NextResponse.json({ source: "cache", playlists: cached.playlists });
  }

  const history = await db
    .collection<ListeningHistoryDoc>("listening_history")
    .find({ userId: session.userId })
    .sort({ playCount: -1 })
    .limit(60)
    .toArray();
  if (history.length < 8) return guestFallback();

  let playlists;
  try {
    playlists = await generateSmartPlaylists(
      history.map((h) => ({
        songId: h.songId,
        title: h.title,
        artist: h.artist,
        language: h.language,
      })),
    );
  } catch (err) {
    console.error("[smart-playlists] generation failed:", err);
    return guestFallback();
  }

  await db
    .collection<SmartPlaylistsDoc>("smart_playlists")
    .updateOne(
      { userId: session.userId },
      { $set: { playlists, generatedAt: new Date() }, $setOnInsert: { userId: session.userId } },
      { upsert: true },
    );

  return NextResponse.json({ source: "ai", playlists });
}
