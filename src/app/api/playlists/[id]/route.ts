import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";
import { ensureIndexes, type PlaylistDoc } from "@/lib/db-schema";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

function getPlaylistId(params: { id: string }) {
  return params.id;
}

// ── GET /api/playlists/[id] ── get a single playlist
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureIndexes();
  const db = await getDb();
  const id = getPlaylistId(params);

  let playlist: PlaylistDoc | null = null;
  try {
    playlist = await db
      .collection<PlaylistDoc>("playlists")
      .findOne({ _id: new ObjectId(id), userId: session.userId });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!playlist) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: playlist._id!.toString(),
    name: playlist.name,
    slug: playlist.slug,
    description: playlist.description ?? "",
    image: playlist.image ?? playlist.songs[0]?.image ?? "",
    songCount: playlist.songs.length,
    songs: playlist.songs,
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
  });
}

// ── PATCH /api/playlists/[id] ── update name/description or reorder songs
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureIndexes();
  const db = await getDb();
  const id = getPlaylistId(params);
  const body = await req.json();
  const now = new Date();

  const $set: Record<string, any> = { updatedAt: now };
  if (body.name !== undefined) $set.name = body.name.trim();
  if (body.description !== undefined) $set.description = body.description;
  if (body.songs !== undefined) $set.songs = body.songs; // full reorder

  try {
    const result = await db
      .collection<PlaylistDoc>("playlists")
      .findOneAndUpdate(
        { _id: new ObjectId(id), userId: session.userId },
        { $set },
        { returnDocument: "after" },
      );
    const doc = result as any;
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      description: doc.description ?? "",
      image: doc.image ?? doc.songs?.[0]?.image ?? "",
      songCount: doc.songs?.length ?? 0,
      songs: doc.songs ?? [],
      updatedAt: doc.updatedAt,
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

// ── DELETE /api/playlists/[id] ── delete the playlist
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureIndexes();
  const db = await getDb();
  const id = getPlaylistId(params);

  try {
    const result = await db
      .collection<PlaylistDoc>("playlists")
      .deleteOne({ _id: new ObjectId(id), userId: session.userId });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
