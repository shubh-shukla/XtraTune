import { type NextRequest, NextResponse } from "next/server";
import { ensureIndexes, type FavoriteDoc } from "@/lib/db-schema";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

/**
 * GET /api/user/favorites?type=track
 * Returns all favorites of the given entity type for the logged-in user.
 */
export async function GET(req: NextRequest) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entityType = req.nextUrl.searchParams.get("type") || "track";
  if (!["track", "album", "playlist"].includes(entityType)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  await ensureIndexes();
  const db = await getDb();
  const docs = await db
    .collection<FavoriteDoc>("favorites")
    .find({ userId: session.userId, entityType: entityType as any })
    .sort({ createdAt: -1 })
    .toArray();

  const ids = docs.map((d) => d.entityId);
  return NextResponse.json({ ids, count: ids.length });
}

/**
 * POST /api/user/favorites
 * Body: { entityType: "track"|"album"|"playlist", entityId: string }
 * Toggles the favorite – returns { liked: boolean }
 */
export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { entityType?: string; entityId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { entityType, entityId } = body;
  if (!entityType || !entityId || !["track", "album", "playlist"].includes(entityType)) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  await ensureIndexes();
  const db = await getDb();
  const col = db.collection<FavoriteDoc>("favorites");

  const filter = {
    userId: session.userId,
    entityType: entityType as FavoriteDoc["entityType"],
    entityId,
  };

  const existing = await col.findOne(filter);

  if (existing) {
    await col.deleteOne({ _id: existing._id });
    return NextResponse.json({ liked: false });
  }

  await col.insertOne({ ...filter, createdAt: new Date() });
  return NextResponse.json({ liked: true });
}
