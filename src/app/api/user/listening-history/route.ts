import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { buildHistoryUpdate } from "@/lib/recommendations/history";
import { getSession } from "@/lib/session";
import type { ListeningHistoryDoc } from "@/lib/db-schema";

export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.songId || !body?.title || !body?.artist) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();
  const op = buildHistoryUpdate({
    userId: session.userId,
    songId: String(body.songId),
    title: String(body.title),
    artist: String(body.artist),
    language: String(body.language ?? ""),
  });
  await db
    .collection<ListeningHistoryDoc>("listening_history")
    .updateOne(op.filter, op.update, op.options);

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ items: [] });
  const client = await clientPromise;
  const db = client.db();
  const items = await db
    .collection<ListeningHistoryDoc>("listening_history")
    .find({ userId: session.userId })
    .sort({ playCount: -1, lastPlayedAt: -1 })
    .limit(60)
    .toArray();
  return NextResponse.json({ items });
}
