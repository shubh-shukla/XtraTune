import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const client = await clientPromise;
  const db = client.db();
  await Promise.all([
    db.collection("taste_profiles").deleteOne({ userId: session.userId }),
    db.collection("recommendation_cache").deleteOne({ userId: session.userId }),
    db.collection("smart_playlists").deleteOne({ userId: session.userId }),
  ]);
  return NextResponse.json({ ok: true });
}
