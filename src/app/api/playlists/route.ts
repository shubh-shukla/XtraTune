import { type NextRequest, NextResponse } from "next/server";
import { ensureIndexes, type PlaylistDoc } from "@/lib/db-schema";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 80) || "playlist"
  );
}

// ── GET /api/playlists ── list all playlists for the logged-in user
export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureIndexes();
  const db = await getDb();
  const playlists = await db
    .collection<PlaylistDoc>("playlists")
    .find({ userId: session.userId })
    .sort({ updatedAt: -1 })
    .toArray();

  return NextResponse.json({
    playlists: playlists.map((p) => ({
      id: p._id!.toString(),
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      image: p.image ?? "",
      songCount: p.songs.length,
      songs: p.songs,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  });
}

// ── POST /api/playlists ── create a new playlist
export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  await ensureIndexes();
  const db = await getDb();
  const now = new Date();
  let slug = slugify(name);

  // Ensure slug uniqueness per user
  const existing = await db
    .collection<PlaylistDoc>("playlists")
    .findOne({ userId: session.userId, slug });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const doc: Omit<PlaylistDoc, "_id"> = {
    userId: session.userId,
    name,
    slug,
    description: body.description ?? "",
    image: "",
    songs: [],
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection<PlaylistDoc>("playlists").insertOne(doc as any);

  return NextResponse.json(
    {
      id: result.insertedId.toString(),
      name: doc.name,
      slug: doc.slug,
      description: doc.description,
      image: "",
      songCount: 0,
      songs: [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    },
    { status: 201 },
  );
}
