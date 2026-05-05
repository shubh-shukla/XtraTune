import { getDb } from "./mongodb";

/**
 * Ensure all required indexes exist.
 * Called once on first API hit (cached promise).
 */
let _ready: Promise<void> | null = null;

export function ensureIndexes(): Promise<void> {
  if (_ready) return _ready;
  _ready = _setup();
  return _ready;
}

async function _setup() {
  const db = await getDb();

  // ── users collection ──────────────────────────
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("users").createIndex({ provider: 1, providerId: 1 }, { unique: true });

  // ── favorites collection ──────────────────────
  // Unique constraint prevents duplicate likes
  await db
    .collection("favorites")
    .createIndex({ userId: 1, entityType: 1, entityId: 1 }, { unique: true });
  await db.collection("favorites").createIndex({ userId: 1 });

  // ── playback_state collection ─────────────────
  await db.collection("playback_state").createIndex({ userId: 1 }, { unique: true });

  // ── playlists collection ──────────────────────
  await db.collection("playlists").createIndex({ userId: 1 });
  await db.collection("playlists").createIndex({ userId: 1, slug: 1 }, { unique: true });

  // ── listening_history collection ──────────────
  await db
    .collection<ListeningHistoryDoc>("listening_history")
    .createIndex({ userId: 1, songId: 1 }, { unique: true });
  await db
    .collection<ListeningHistoryDoc>("listening_history")
    .createIndex({ userId: 1, playCount: -1 });
  await db
    .collection<ListeningHistoryDoc>("listening_history")
    .createIndex({ userId: 1, lastPlayedAt: -1 });

  // ── AI output caches ──────────────────────────
  await db
    .collection<TasteProfileDoc>("taste_profiles")
    .createIndex({ userId: 1 }, { unique: true });
  await db
    .collection<SmartPlaylistsDoc>("smart_playlists")
    .createIndex({ userId: 1 }, { unique: true });
  await db
    .collection<RecommendationCacheDoc>("recommendation_cache")
    .createIndex({ userId: 1 }, { unique: true });
}

// ── TypeScript types for documents ──────────────

export interface UserDoc {
  _id?: any;
  email: string;
  name: string;
  image?: string;
  provider: string; // "github" | "google"
  providerId: string; // provider's user ID
  createdAt: Date;
  updatedAt: Date;
}

export interface FavoriteDoc {
  _id?: any;
  userId: string; // ObjectId as hex string
  entityType: "track" | "album" | "playlist";
  entityId: string; // saavn track/album/playlist id
  createdAt: Date;
}

export interface PlaybackStateDoc {
  _id?: any;
  userId: string;
  songId: string;
  position: number; // seconds
  playlist: PlaybackPlaylistItem[];
  currentIndex: number;
  updatedAt: Date;
}

export interface PlaybackPlaylistItem {
  id: string;
  title?: string;
  artist?: string;
  image?: string;
  duration?: number;
}

// ── Custom Playlists ─────────────────────────────

export interface PlaylistSongDoc {
  id: string; // saavn song id
  title: string;
  artist: string;
  image: string;
  duration: number;
  addedAt: Date;
}

export interface PlaylistDoc {
  _id?: any;
  userId: string; // ObjectId hex
  name: string;
  slug: string; // URL-safe unique per user
  description?: string;
  image?: string; // first song's image or custom
  songs: PlaylistSongDoc[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ListeningHistoryDoc {
  userId: string;
  songId: string;
  title: string;
  artist: string;
  language: string;
  playCount: number;
  lastPlayedAt: Date;
}

export interface TasteProfileDoc {
  userId: string;
  profile: {
    topGenres: string[];
    topMoods: string[];
    topLanguages: string[];
    topArtists: string[];
    vibeDescription: string;
  };
  generatedAt: Date;
  basedOnSongCount: number;
}

export interface SmartPlaylistsDoc {
  userId: string;
  playlists: Array<{
    name: string;
    description: string;
    songIds: string[];
    theme: string;
  }>;
  generatedAt: Date;
}

export interface RecommendationCacheDoc {
  userId: string;
  candidatePoolHash: string;
  ranked: Array<{ songId: string; score: number; reason: string }>;
  generatedAt: Date;
}
