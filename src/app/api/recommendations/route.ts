import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { music } from "@/lib/music";
import { runRecommendationPipeline } from "@/lib/recommendations/pipeline";
import { scoreHistory } from "@/lib/recommendations/score";
import { getSession } from "@/lib/session";
import { gethomepageData } from "@/utils/get-home-data";
import type {
  ListeningHistoryDoc,
  TasteProfileDoc,
  RecommendationCacheDoc,
  FavoriteDoc,
} from "@/lib/db-schema";

const PROFILE_TTL_DAYS = 7;
const PROFILE_PLAY_DELTA = 20;
const SEED_COUNT = 5;
const CANDIDATE_LIMIT = 30;

const isStaleProfile = (doc: TasteProfileDoc | null, currentSongs: number) => {
  if (!doc) return true;
  const ageDays = (Date.now() - new Date(doc.generatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > PROFILE_TTL_DAYS) return true;
  if (currentSongs - doc.basedOnSongCount >= PROFILE_PLAY_DELTA) return true;
  return false;
};

const fetchSuggestionsFor = async (songId: string) => {
  try {
    const { data } = await music.get(`/songs/${songId}/suggestions?limit=10`);
    const list: any[] = data?.data ?? [];
    return list.map((s) => ({
      songId: s.id,
      title: s.name ?? s.title ?? "",
      artist: s.artists?.primary?.map((a: any) => a.name).join(", ") ?? s.primaryArtists ?? "",
      language: s.language ?? "",
      image: s.image ?? [],
      downloadUrl: s.downloadUrl ?? [],
    }));
  } catch {
    return [];
  }
};

const guestFallback = async () => {
  const home = await gethomepageData();
  const songs = home?.data.trending.songs ?? [];
  return NextResponse.json({
    source: "guest",
    items: songs.slice(0, 20).map((s: any) => ({ ...s, reason: "" })),
  });
};

export async function GET() {
  const session = getSession();
  if (!session) return guestFallback();

  const client = await clientPromise;
  const db = client.db();

  const history = await db
    .collection<ListeningHistoryDoc>("listening_history")
    .find({ userId: session.userId })
    .sort({ playCount: -1 })
    .limit(60)
    .toArray();

  if (history.length < 5) return guestFallback();

  const favRows = await db
    .collection<FavoriteDoc>("favorites")
    .find({ userId: session.userId, entityType: "track" }, { projection: { entityId: 1 } })
    .toArray();
  const favIds = new Set<string>(favRows.map((f) => f.entityId));

  const scored = scoreHistory(
    history.map((h) => ({ songId: h.songId, playCount: h.playCount })),
    favIds,
  );
  const seedIds = scored.slice(0, SEED_COUNT).map((s) => s.songId);

  const seedResults = await Promise.all(seedIds.map(fetchSuggestionsFor));
  const flatten = seedResults.flat();
  const seenIds = new Set<string>([...seedIds, ...Array.from(favIds)]);
  const candidatesAll = flatten
    .filter((c) => {
      if (!c.songId || seenIds.has(c.songId)) return false;
      seenIds.add(c.songId);
      return true;
    })
    .slice(0, CANDIDATE_LIMIT);

  if (candidatesAll.length === 0) return guestFallback();

  const cachedProfileDoc = await db
    .collection<TasteProfileDoc>("taste_profiles")
    .findOne({ userId: session.userId });
  const cachedRankingDoc = await db
    .collection<RecommendationCacheDoc>("recommendation_cache")
    .findOne({ userId: session.userId });

  const stale = isStaleProfile(cachedProfileDoc, history.length);
  const cachedProfile = !stale && cachedProfileDoc ? cachedProfileDoc.profile : null;

  const cachedRanking =
    cachedRankingDoc &&
    Date.now() - new Date(cachedRankingDoc.generatedAt).getTime() < 24 * 60 * 60 * 1000
      ? { candidatePoolHash: cachedRankingDoc.candidatePoolHash, ranked: cachedRankingDoc.ranked }
      : null;

  const result = await runRecommendationPipeline({
    historyTop: history.map((h) => ({
      songId: h.songId,
      title: h.title,
      artist: h.artist,
      language: h.language,
      playCount: h.playCount,
    })),
    candidates: candidatesAll,
    cachedProfile,
    cachedRanking,
  });

  if (result.source === "ai" && stale) {
    await db.collection<TasteProfileDoc>("taste_profiles").updateOne(
      { userId: session.userId },
      {
        $set: {
          profile: result.profile,
          generatedAt: new Date(),
          basedOnSongCount: history.length,
        },
        $setOnInsert: { userId: session.userId },
      },
      { upsert: true },
    );
  }
  if (result.source === "ai") {
    await db.collection<RecommendationCacheDoc>("recommendation_cache").updateOne(
      { userId: session.userId },
      {
        $set: {
          candidatePoolHash: result.candidatePoolHash,
          ranked: result.ranked,
          generatedAt: new Date(),
        },
        $setOnInsert: { userId: session.userId },
      },
      { upsert: true },
    );
  }

  const candidateById = new Map(candidatesAll.map((c) => [c.songId, c]));
  const items = result.ranked
    .map((r) => {
      const c = candidateById.get(r.songId);
      if (!c) return null;
      return { ...c, reason: r.reason, score: r.score };
    })
    .filter(Boolean);

  return NextResponse.json({ source: result.source, items });
}
