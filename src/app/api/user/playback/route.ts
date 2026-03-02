import { type NextRequest, NextResponse } from "next/server";
import { ensureIndexes, type PlaybackStateDoc, type PlaybackPlaylistItem } from "@/lib/db-schema";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

/**
 * GET /api/user/playback
 * Returns the last playback state for the logged-in user.
 */
export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureIndexes();
  const db = await getDb();
  const doc = await db
    .collection<PlaybackStateDoc>("playback_state")
    .findOne({ userId: session.userId });

  if (!doc) {
    return NextResponse.json({ playback: null });
  }

  return NextResponse.json({
    playback: {
      songId: doc.songId,
      position: doc.position,
      playlist: doc.playlist,
      currentIndex: doc.currentIndex,
      updatedAt: doc.updatedAt,
    },
  });
}

/**
 * PUT /api/user/playback
 * Body: { songId, position, playlist, currentIndex }
 * Upserts playback state.
 */
export async function PUT(req: NextRequest) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    songId?: string;
    position?: number;
    playlist?: PlaybackPlaylistItem[];
    currentIndex?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { songId, position, playlist, currentIndex } = body;
  if (!songId || position === undefined || currentIndex === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await ensureIndexes();
  const db = await getDb();

  await db.collection<PlaybackStateDoc>("playback_state").updateOne(
    { userId: session.userId },
    {
      $set: {
        songId,
        position: Math.max(0, position),
        playlist: playlist ?? [],
        currentIndex,
        updatedAt: new Date(),
      },
      $setOnInsert: { userId: session.userId },
    },
    { upsert: true },
  );

  return NextResponse.json({ ok: true });
}
