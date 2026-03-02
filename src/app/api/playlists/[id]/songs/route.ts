import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";
import { ensureIndexes, type PlaylistDoc, type PlaylistSongDoc } from "@/lib/db-schema";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

// ── POST /api/playlists/[id]/songs ── add a song to the playlist
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureIndexes();
  const db = await getDb();
  const body = await req.json();

  const song: PlaylistSongDoc = {
    id: body.id,
    title: body.title ?? "",
    artist: body.artist ?? "",
    image: body.image ?? "",
    duration: Number(body.duration) || 0,
    addedAt: new Date(),
  };

  if (!song.id) {
    return NextResponse.json({ error: "Song id required" }, { status: 400 });
  }

  try {
    // Push only if song not already in playlist
    const result = await db.collection<PlaylistDoc>("playlists").findOneAndUpdate(
      {
        _id: new ObjectId(params.id),
        userId: session.userId,
        "songs.id": { $ne: song.id },
      },
      {
        $push: { songs: song as any },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" },
    );
    const doc = result as any;
    if (!doc) {
      // Either not found or song already exists – try to find it
      const existing = await db
        .collection<PlaylistDoc>("playlists")
        .findOne({ _id: new ObjectId(params.id), userId: session.userId });
      if (!existing) {
        return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
      }
      return NextResponse.json({
        message: "Song already in playlist",
        songCount: existing.songs.length,
      });
    }
    return NextResponse.json({
      message: "Song added",
      songCount: doc.songs.length,
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

// ── DELETE /api/playlists/[id]/songs ── remove a song by songId
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureIndexes();
  const db = await getDb();
  const { searchParams } = new URL(req.url);
  const songId = searchParams.get("songId");

  if (!songId) {
    return NextResponse.json({ error: "songId required" }, { status: 400 });
  }

  try {
    const result = await db.collection<PlaylistDoc>("playlists").findOneAndUpdate(
      { _id: new ObjectId(params.id), userId: session.userId },
      {
        $pull: { songs: { id: songId } as any },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" },
    );
    const doc = result as any;
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      message: "Song removed",
      songCount: doc.songs.length,
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
