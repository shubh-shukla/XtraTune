# AI Recommendations — Design Spec

**Date:** 2026-05-05
**Status:** Draft, awaiting review
**Scope:** XtraTune (Next.js web) + XtraTune-App (Expo mobile)

---

## 1. Goal

Introduce real AI to XtraTune by adding personalized music recommendations powered by Google Gemini (free tier). Two visible features land together:

- **For You** — a personalized song feed re-ranked and explained by AI
- **Smart Playlists** — AI-clustered themed playlists from the user's history (e.g. "Late-Night Bollywood Vibes")

For logged-in users, both are personalized. For guests, both fall back to trending content.

The AI does work that pure heuristics cannot:
- Infers genre/mood/vibe from artist+title (JioSaavn does not expose these)
- Re-ranks candidate songs against a learned taste profile
- Writes one-line "why we picked this" explanations
- Clusters listening history into themed playlists with names + descriptions

---

## 2. Non-Goals

- No paid AI service. Stays inside Google Gemini free tier (1M tokens/day, 15 RPM).
- No new external music API. JioSaavn (via the existing scraper) remains the only catalog source.
- No collaborative filtering across users. v1 is single-user signal only.
- No AI-generated audio (no TTS, no AI DJ voice).
- No real-time AI on every page load — outputs are cached aggressively.

---

## 3. Architecture

```
┌──────────────┐     plays     ┌──────────────────┐
│   Player     │──────────────▶│ listening_history│
└──────────────┘                └─────────┬────────┘
                                          │
                              (top songs) │
                                          ▼
                  ┌────────────────────────────────────┐
                  │  Recommendations Service           │
                  │                                    │
                  │  ┌──────────────┐  ┌────────────┐  │
                  │  │ JioSaavn     │  │  Gemini    │  │
                  │  │ /suggestions │  │  (re-rank, │  │
                  │  │ (candidates) │  │  explain,  │  │
                  │  │              │  │  cluster)  │  │
                  │  └──────────────┘  └────────────┘  │
                  │                                    │
                  └─────────┬─────────────────┬────────┘
                            │                 │
              taste_profiles│        smart_playlists
                  (cache)   │           (cache)
                            ▼                 ▼
                  ┌─────────────────────────────────┐
                  │   /api/recommendations          │
                  │   /api/smart-playlists          │
                  └────────┬────────────────┬───────┘
                           │                │
                           ▼                ▼
                   Web (Next.js)    Mobile (Expo)
                   For You row      For You row
                   /recommendations Smart Playlists
                   page             screen
```

---

## 4. Data Model

### 4.1 `listening_history` (high-write, source of truth)

```ts
interface ListeningHistoryDoc {
  userId: string;       // ObjectId hex
  songId: string;       // JioSaavn track id
  title: string;        // denormalized for AI prompts
  artist: string;       // denormalized for AI prompts
  language: string;     // from JioSaavn metadata
  playCount: number;    // incremented on each meaningful play
  lastPlayedAt: Date;
}
```

Indexes: `{userId:1, songId:1}` unique, `{userId:1, playCount:-1}`, `{userId:1, lastPlayedAt:-1}`.

A "meaningful play" = song listened to for ≥ 30 seconds. Skips don't count.

### 4.2 `taste_profiles` (AI output cache)

```ts
interface TasteProfileDoc {
  userId: string;
  profile: {
    topGenres: string[];      // AI-inferred: ["bollywood-romantic", "punjabi-pop"]
    topMoods: string[];       // ["upbeat", "melancholic"]
    topLanguages: string[];   // computed directly from history
    topArtists: string[];     // computed directly from history
    vibeDescription: string;  // AI-written: 1-2 sentence summary
  };
  generatedAt: Date;
  basedOnSongCount: number;
}
```

Index: `{userId:1}` unique.

**Refresh trigger:** stale (>7 days) OR ≥20 new plays since last generation. Lazy-refreshed on read.

### 4.3 `smart_playlists` (AI output cache)

```ts
interface SmartPlaylistsDoc {
  userId: string;
  playlists: Array<{
    name: string;             // "Late-Night Bollywood Vibes"
    description: string;      // AI-written one-liner
    songIds: string[];        // 8-15 songs from user's history
    theme: string;            // internal slug for stable identity
  }>;
  generatedAt: Date;
}
```

Index: `{userId:1}` unique. Refreshed weekly per user, lazily on read.

### 4.4 `recommendation_cache` (re-rank result cache)

```ts
interface RecommendationCacheDoc {
  userId: string;
  candidatePoolHash: string;   // sha256 of sorted candidate songIds — invalidates when pool changes
  ranked: Array<{
    songId: string;
    score: number;
    reason: string;            // ≤80 chars
  }>;
  generatedAt: Date;
}
```

Index: `{userId:1}` unique. TTL: 24h. If `candidatePoolHash` doesn't match the freshly computed pool, treat as miss and re-rank.

### 4.5 Schema additions

`src/lib/db-schema.ts` gains the four interfaces above and four index-creation calls inside `_setup()`.

---

## 5. AI Service Layer

### 5.1 Gemini integration

- Library: `@google/generative-ai` (official SDK)
- Model: `gemini-1.5-flash` (free tier, fast, JSON-mode capable)
- Env var: `GEMINI_API_KEY` in `.env.local` (added to `.env.example` with placeholder)
- New file: `src/lib/ai/gemini.ts` — single thin wrapper exposing `generateJSON(prompt, schema)` and `generateText(prompt)`.

### 5.2 Prompt 1 — Taste Profile Generator

**Input:** Top 30 songs from user's `listening_history` (sorted by `playCount` desc), with `title + artist + language + playCount`.

**Output (strict JSON):**
```json
{
  "topGenres": ["...", "..."],
  "topMoods": ["...", "..."],
  "vibeDescription": "..."
}
```

`topLanguages` and `topArtists` are computed deterministically (no AI needed) from the same input.

### 5.3 Prompt 2 — Re-ranker + Explainer

**Input:** taste profile + 30 candidate songs (from JioSaavn `/suggestions` seeded by top-scored history songs).

**Output (strict JSON):**
```json
{
  "ranked": [
    {"songId": "...", "score": 92, "reason": "Driving Punjabi pop you'd vibe with after Diljit"},
    ...
  ]
}
```

Truncate to top 20. `reason` ≤ 80 chars.

### 5.4 Prompt 3 — Smart Playlist Clusterer

**Input:** Top 60 songs from user's `listening_history` with `title + artist + language`.

**Output (strict JSON):**
```json
{
  "playlists": [
    {
      "name": "...",
      "description": "...",
      "theme": "kebab-case-slug",
      "songIds": ["...", "..."]
    },
    ...
  ]
}
```

Constraint: 3–4 playlists, 8–15 songs each, every `songId` must be one we sent in.

### 5.5 Token budget

| Prompt | Approx tokens / call | Frequency / user | Daily cost (1 user) |
|---|---|---|---|
| Taste profile | ~1,500 in / ~200 out | once / 7 days | ~240 |
| Re-rank + explain | ~3,000 in / ~1,500 out | once / 24h (cached) | ~4,500 |
| Smart playlists | ~3,500 in / ~1,000 out | once / 7 days | ~640 |

Free tier = 1M tokens/day → comfortably supports ~150 active users on the free tier alone.

---

## 6. Recommendations Pipeline

When `/api/recommendations` is hit for a logged-in user:

1. Load taste profile from `taste_profiles` (regenerate via Prompt 1 if stale).
2. Pick top 5 seed songs from `listening_history` by `score = (isFavorite ? 2 : 0) + min(playCount, 5)`.
3. For each seed, call existing `/api/suggestions?id=...` in parallel → merge candidate pool, dedupe, drop seeds and already-favorited songs.
4. Compute `candidatePoolHash = sha256(sorted candidate songIds joined)`. If `recommendation_cache` for this user has matching hash and is <24h old, return its `ranked` array directly.
5. Otherwise call Prompt 2 with taste profile + candidate pool → upsert into `recommendation_cache` with the new hash → return ranked songs + reasons.

Guest path: skip all AI, return trending songs from `gethomepageData()`.

---

## 7. API Endpoints

All Next.js routes under `src/app/api/`.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/user/listening-history` | POST | Log a play (upsert + increment) |
| `/api/user/listening-history` | GET | Read user's top history (debug/inspection) |
| `/api/recommendations` | GET | Personalized feed (For You) — guest fallback to trending |
| `/api/smart-playlists` | GET | AI-themed playlists from history — guest fallback to curated playlists |
| `/api/recommendations/refresh` | POST | Force refresh (clears taste profile + cache) |

All endpoints respect existing `getSession()` pattern. Mobile app reuses the same routes (it already hits the Next.js backend).

---

## 8. Frontend — Web (Next.js)

### 8.1 Player hook

In `src/components/Player.tsx` (or its hook), when a song crosses the 30-second mark, fire `POST /api/user/listening-history` with `{songId, title, artist, language}`. Debounced — one call per song per session.

### 8.2 Home screen

Add a new section component `src/app/sections/for-you.tsx`, rendered above Trending Songs on `src/app/page.tsx`. Mirrors `TrendingSongs` styling — horizontal scroll of `SongCard`s, with the AI explanation shown as a small subtitle under each card.

Add a "See all" link → `/recommendations`.

Add a `src/app/sections/smart-playlists.tsx` row (uses existing playlist cards) right below the Trending Albums section.

### 8.3 Dedicated `/recommendations` page

`src/app/recommendations/page.tsx` — full grid of recommended songs with reasons, plus a "Refresh" button that hits `/api/recommendations/refresh`.

### 8.4 Loading / empty states

- Logged-in user with <5 plays in history: show "Listen to a few songs and your AI feed will appear here" empty state.
- Skeleton loaders during AI calls (re-uses existing patterns).

---

## 9. Frontend — Mobile (XtraTune-App)

Mirrors web 1:1 since both apps use the same backend. New files only — no shared layout changes.

- New screen: `app/recommendations.tsx` — full For You list.
- New screen: `app/smart-playlists.tsx` — AI playlist grid.
- New section component on home: For You row + Smart Playlists row.
- Player tracking: in the Expo Audio playback hook, fire `POST /api/user/listening-history` at the 30s mark.

---

## 10. Free-Tier Guardrails

To stay safely inside Gemini's free tier:

- **Hard daily request cap per user**: 5 re-rank calls/day. After that, serve last cached result.
- **Process-wide rate limiter**: simple in-memory token bucket capped at 12 RPM (Gemini's free limit is 15) so concurrent users don't trip the hard limit.
- **Lazy generation, eager caching**: nothing AI runs unless a user opens a recommendations surface. Once run, cached aggressively.
- **Graceful degradation**: if Gemini call fails or returns malformed JSON, fall back to JioSaavn suggestions ranked by score with no AI reasons. The feature never hard-breaks.
- **No AI for guests**: zero token spend on anonymous traffic.

---

## 11. Error Handling

- Gemini timeout / 5xx / quota error → log, fall back to non-AI ranked candidates.
- Malformed AI JSON → schema validation with `zod`, fall back on validation failure.
- MongoDB write failures on history → log and swallow (history is best-effort, not critical path).
- JioSaavn `/suggestions` failure → fall back to trending.

No silent failures: every fallback is logged with reason so it's debuggable.

---

## 12. Telemetry

Minimal v1 — log to console in dev, structured logs in production:
- `recs.served` with `{userId, source: "ai" | "fallback", count, latencyMs}`
- `gemini.call` with `{prompt, tokensIn, tokensOut, latencyMs, ok}`
- `history.write` with `{userId, songId}` (debug only)

---

## 13. Out of Scope (v1)

- Cross-user collaborative filtering
- "Hide this song" / negative feedback signal
- Per-mood filtering on the recommendations page
- AI-narrated DJ voice
- Genre/mood detection from audio (would require audio analysis APIs)

---

## 14. Rollout Plan

1. Backend: schema + listening history endpoint + Gemini wrapper
2. AI: taste profile prompt + re-rank prompt + smart playlist prompt (with prompt unit tests)
3. Recommendations API + smart playlists API + caching layer
4. Web frontend: home sections + dedicated page
5. Mobile frontend: home sections + dedicated screens
6. Manual testing with a seeded user, then dogfood for a week before announcing.

---

## 15. Success Criteria

- Logged-in users with ≥10 history items get a non-empty For You feed with AI explanations.
- Each smart playlist has a coherent theme verifiable by inspection.
- p95 latency for `/api/recommendations` < 2.5s warm cache, < 6s cold.
- Zero crashes when Gemini is unreachable — fallback path serves results.
- Stays inside Gemini free tier with up to 50 daily active users.
