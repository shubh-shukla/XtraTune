# AI Recommendations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship AI-powered "For You" recommendations and AI-clustered "Smart Playlists" to XtraTune (web) and XtraTune-App (mobile), powered by Google Gemini's free tier.

**Architecture:** Listening history is logged to MongoDB. A pipeline of three Gemini prompts (taste profile → re-rank/explain → cluster) generates personalized output, cached aggressively to stay inside the free quota. Web and mobile UIs share the same Next.js backend; mobile only adds new client routes and screens.

**Tech Stack:** Next.js 14 (App Router), TypeScript, MongoDB, `@google/generative-ai`, Vitest (new), Expo Router, React Native.

**Spec:** `docs/superpowers/specs/2026-05-05-ai-recommendations-design.md`

---

## File Structure

### XtraTune (web) — new files
- `vitest.config.ts` — test runner config
- `tests/setup.ts` — test environment bootstrap
- `src/lib/ai/gemini.ts` — thin Gemini SDK wrapper, JSON-mode helper
- `src/lib/ai/rate-limiter.ts` — process-wide token bucket (12 RPM)
- `src/lib/ai/prompts/taste-profile.ts` — Prompt 1
- `src/lib/ai/prompts/rerank.ts` — Prompt 2
- `src/lib/ai/prompts/smart-playlists.ts` — Prompt 3
- `src/lib/recommendations/score.ts` — seed scoring + pool hashing
- `src/lib/recommendations/pipeline.ts` — full recommendation pipeline orchestrator
- `src/lib/recommendations/smart-playlists-service.ts` — smart playlist generator + cache reader
- `src/app/api/user/listening-history/route.ts` — POST/GET history
- `src/app/api/recommendations/route.ts` — main feed
- `src/app/api/recommendations/refresh/route.ts` — force refresh
- `src/app/api/smart-playlists/route.ts` — themed playlists
- `src/hooks/use-listening-history.ts` — client hook to log plays
- `src/hooks/use-recommendations.ts` — SWR hook for recommendations
- `src/hooks/use-smart-playlists.ts` — SWR hook for smart playlists
- `src/app/sections/for-you.tsx` — home page section
- `src/app/sections/smart-playlists.tsx` — home page section
- `src/app/recommendations/page.tsx` — dedicated /recommendations page
- `src/app/recommendations/loading.tsx`

### XtraTune (web) — modified files
- `src/lib/db-schema.ts` — add 4 new collection interfaces + indexes
- `src/components/Player.tsx` — fire history log at 30s mark
- `src/app/page.tsx` — add new home sections
- `.env.example` — add `GEMINI_API_KEY`
- `package.json` — add deps + test scripts

### XtraTune-App (mobile) — new files
- `src/components/home/ForYouSection.tsx`
- `src/components/home/SmartPlaylistsSection.tsx`
- `src/hooks/useListeningHistory.ts`
- `app/recommendations.tsx`
- `app/smart-playlists.tsx`

### XtraTune-App (mobile) — modified files
- `src/api/index.ts` — add 4 new client functions
- `app/(drawer)/(tabs)/index.tsx` — render new sections
- `src/components/player/FullScreenPlayer.tsx` — fire history log at 30s

---

## Conventions

- **All commits** run from the relevant repo root (`XtraTune/` or `XtraTune-App/`).
- **All file paths in tasks** are relative to the repo root unless explicitly noted.
- **Run tests** with `pnpm vitest run <path>` (web) — mobile has no unit tests; verify via running app.
- **TDD discipline** applies to backend logic (prompts, scoring, pipeline). UI components are verified by running the dev server and exercising them in a browser.
- **Commits** are conventional-commit-ish (`feat:`, `test:`, `chore:`) and small.

---

## Task 1: Test runner + Gemini SDK setup

**Files:**
- Create: `XtraTune/vitest.config.ts`
- Create: `XtraTune/tests/setup.ts`
- Modify: `XtraTune/package.json`
- Modify: `XtraTune/.env.example`

- [ ] **Step 1: Install dependencies**

```bash
cd XtraTune
pnpm add @google/generative-ai zod
pnpm add -D vitest @vitest/ui @types/node
```

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Create test setup**

Create `tests/setup.ts`:

```ts
process.env.MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/xtratune-test";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-jwt-secret";
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "test-gemini-key";
process.env.SCRAPER_URL = process.env.SCRAPER_URL ?? "http://localhost:9999";
```

- [ ] **Step 4: Add test scripts**

In `package.json` `"scripts"`, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Add env var placeholder**

Append to `.env.example`:

```
# ── Google Gemini (AI recommendations) ─────────
# https://aistudio.google.com/app/apikey  (free tier — 1M tokens/day)
GEMINI_API_KEY=
```

- [ ] **Step 6: Verify Vitest runs**

Run: `pnpm test`
Expected: `No test files found` exit 0 (no tests yet) — confirms config is valid.

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts tests/setup.ts package.json pnpm-lock.yaml .env.example
git commit -m "chore: add Vitest, Gemini SDK, zod for AI features"
```

---

## Task 2: MongoDB schema additions

**Files:**
- Modify: `XtraTune/src/lib/db-schema.ts`

- [ ] **Step 1: Read current schema file**

Read `src/lib/db-schema.ts` to identify the existing `_setup()` function and where new interfaces/indexes belong.

- [ ] **Step 2: Append the four new interfaces**

At the end of the interface block, before `_setup()`, add:

```ts
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
```

- [ ] **Step 3: Add index creation calls inside `_setup()`**

Inside `_setup()` (alongside existing `createIndex` calls), add:

```ts
await db.collection<ListeningHistoryDoc>("listening_history")
  .createIndex({ userId: 1, songId: 1 }, { unique: true });
await db.collection<ListeningHistoryDoc>("listening_history")
  .createIndex({ userId: 1, playCount: -1 });
await db.collection<ListeningHistoryDoc>("listening_history")
  .createIndex({ userId: 1, lastPlayedAt: -1 });
await db.collection<TasteProfileDoc>("taste_profiles")
  .createIndex({ userId: 1 }, { unique: true });
await db.collection<SmartPlaylistsDoc>("smart_playlists")
  .createIndex({ userId: 1 }, { unique: true });
await db.collection<RecommendationCacheDoc>("recommendation_cache")
  .createIndex({ userId: 1 }, { unique: true });
```

- [ ] **Step 4: Type-check**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db-schema.ts
git commit -m "feat: add schema for listening history + AI output caches"
```

---

## Task 3: Gemini wrapper

**Files:**
- Create: `XtraTune/src/lib/ai/gemini.ts`
- Create: `XtraTune/tests/lib/ai/gemini.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/lib/ai/gemini.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@google/generative-ai", () => {
  const generateContent = vi.fn();
  return {
    GoogleGenerativeAI: vi.fn(() => ({
      getGenerativeModel: () => ({ generateContent }),
    })),
    __mock: { generateContent },
  };
});

import { generateJSON } from "@/lib/ai/gemini";
import { z } from "zod";

const mod: any = await import("@google/generative-ai");

describe("generateJSON", () => {
  beforeEach(() => mod.__mock.generateContent.mockReset());

  it("parses valid JSON output against schema", async () => {
    mod.__mock.generateContent.mockResolvedValue({
      response: { text: () => '{"value":42}' },
    });
    const schema = z.object({ value: z.number() });
    const out = await generateJSON("p", schema);
    expect(out).toEqual({ value: 42 });
  });

  it("strips markdown fences before parsing", async () => {
    mod.__mock.generateContent.mockResolvedValue({
      response: { text: () => '```json\n{"value":7}\n```' },
    });
    const schema = z.object({ value: z.number() });
    expect(await generateJSON("p", schema)).toEqual({ value: 7 });
  });

  it("throws on invalid JSON", async () => {
    mod.__mock.generateContent.mockResolvedValue({
      response: { text: () => "not json" },
    });
    await expect(generateJSON("p", z.object({}))).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/lib/ai/gemini.test.ts`
Expected: FAIL — module `@/lib/ai/gemini` does not exist.

- [ ] **Step 3: Implement wrapper**

Create `src/lib/ai/gemini.ts`:

```ts
import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z, type ZodSchema } from "zod";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

const client = new GoogleGenerativeAI(apiKey);
const MODEL = "gemini-1.5-flash";

const stripFences = (s: string) =>
  s.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

export async function generateJSON<T>(prompt: string, schema: ZodSchema<T>): Promise<T> {
  const model = client.getGenerativeModel({
    model: MODEL,
    generationConfig: { responseMimeType: "application/json" },
  });
  const result = await model.generateContent(prompt);
  const raw = stripFences(result.response.text());
  const parsed = JSON.parse(raw);
  return schema.parse(parsed);
}

export async function generateText(prompt: string): Promise<string> {
  const model = client.getGenerativeModel({ model: MODEL });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/lib/ai/gemini.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/gemini.ts tests/lib/ai/gemini.test.ts
git commit -m "feat: add Gemini wrapper with JSON-mode + zod validation"
```

---

## Task 4: Token bucket rate limiter

**Files:**
- Create: `XtraTune/src/lib/ai/rate-limiter.ts`
- Create: `XtraTune/tests/lib/ai/rate-limiter.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/lib/ai/rate-limiter.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { createBucket } from "@/lib/ai/rate-limiter";

describe("token bucket", () => {
  it("allows up to capacity then rejects", async () => {
    const bucket = createBucket({ capacity: 3, refillPerSec: 0 });
    expect(await bucket.tryAcquire()).toBe(true);
    expect(await bucket.tryAcquire()).toBe(true);
    expect(await bucket.tryAcquire()).toBe(true);
    expect(await bucket.tryAcquire()).toBe(false);
  });

  it("refills tokens over time", async () => {
    const bucket = createBucket({ capacity: 1, refillPerSec: 1000 });
    expect(await bucket.tryAcquire()).toBe(true);
    expect(await bucket.tryAcquire()).toBe(false);
    await new Promise((r) => setTimeout(r, 10));
    expect(await bucket.tryAcquire()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test, verify failure**

Run: `pnpm vitest run tests/lib/ai/rate-limiter.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement rate limiter**

Create `src/lib/ai/rate-limiter.ts`:

```ts
export interface BucketConfig {
  capacity: number;
  refillPerSec: number;
}

export function createBucket({ capacity, refillPerSec }: BucketConfig) {
  let tokens = capacity;
  let lastRefill = Date.now();

  const refill = () => {
    const now = Date.now();
    const delta = ((now - lastRefill) / 1000) * refillPerSec;
    tokens = Math.min(capacity, tokens + delta);
    lastRefill = now;
  };

  return {
    async tryAcquire(): Promise<boolean> {
      refill();
      if (tokens >= 1) {
        tokens -= 1;
        return true;
      }
      return false;
    },
  };
}

// Process-wide bucket: 12 RPM (Gemini free tier is 15)
export const geminiBucket = createBucket({ capacity: 12, refillPerSec: 12 / 60 });
```

- [ ] **Step 4: Run test, verify pass**

Run: `pnpm vitest run tests/lib/ai/rate-limiter.test.ts`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/rate-limiter.ts tests/lib/ai/rate-limiter.test.ts
git commit -m "feat: add token bucket rate limiter for Gemini calls"
```

---

## Task 5: Listening-history endpoint

**Files:**
- Create: `XtraTune/src/app/api/user/listening-history/route.ts`
- Create: `XtraTune/tests/api/listening-history.test.ts`

- [ ] **Step 1: Write failing test for the upsert helper**

Refactor approach: extract pure logic into `src/lib/recommendations/history.ts` so we can test it without spinning up Next.

Create `tests/lib/recommendations/history.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildHistoryUpdate } from "@/lib/recommendations/history";

describe("buildHistoryUpdate", () => {
  it("returns upsert filter, set-on-insert, and increment", () => {
    const op = buildHistoryUpdate({
      userId: "u1",
      songId: "s1",
      title: "Tum Hi Ho",
      artist: "Arijit Singh",
      language: "hindi",
    });
    expect(op.filter).toEqual({ userId: "u1", songId: "s1" });
    expect(op.update.$inc).toEqual({ playCount: 1 });
    expect(op.update.$set.lastPlayedAt).toBeInstanceOf(Date);
    expect(op.update.$setOnInsert).toMatchObject({
      userId: "u1",
      songId: "s1",
      title: "Tum Hi Ho",
      artist: "Arijit Singh",
      language: "hindi",
    });
  });
});
```

- [ ] **Step 2: Run test, verify failure**

Run: `pnpm vitest run tests/lib/recommendations/history.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement helper**

Create `src/lib/recommendations/history.ts`:

```ts
export interface HistoryInput {
  userId: string;
  songId: string;
  title: string;
  artist: string;
  language: string;
}

export function buildHistoryUpdate(input: HistoryInput) {
  const now = new Date();
  return {
    filter: { userId: input.userId, songId: input.songId },
    update: {
      $inc: { playCount: 1 },
      $set: { lastPlayedAt: now },
      $setOnInsert: {
        userId: input.userId,
        songId: input.songId,
        title: input.title,
        artist: input.artist,
        language: input.language,
      },
    },
    options: { upsert: true as const },
  };
}
```

- [ ] **Step 4: Run test, verify pass**

Run: `pnpm vitest run tests/lib/recommendations/history.test.ts`
Expected: PASS — 1 test.

- [ ] **Step 5: Implement the route**

Create `src/app/api/user/listening-history/route.ts`:

```ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { buildHistoryUpdate } from "@/lib/recommendations/history";
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
  await db.collection<ListeningHistoryDoc>("listening_history")
    .updateOne(op.filter, op.update, op.options);

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ items: [] });
  const client = await clientPromise;
  const db = client.db();
  const items = await db.collection<ListeningHistoryDoc>("listening_history")
    .find({ userId: session.userId })
    .sort({ playCount: -1, lastPlayedAt: -1 })
    .limit(60)
    .toArray();
  return NextResponse.json({ items });
}
```

- [ ] **Step 6: Smoke test manually**

Run: `pnpm dev`. While logged in, in DevTools console:

```js
fetch("/api/user/listening-history", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ songId: "test1", title: "Test", artist: "QA", language: "english" })
}).then(r => r.json()).then(console.log);
```

Expected: `{ ok: true }`. Then `GET /api/user/listening-history` returns the doc.

- [ ] **Step 7: Commit**

```bash
git add src/lib/recommendations/history.ts src/app/api/user/listening-history/route.ts tests/lib/recommendations/history.test.ts
git commit -m "feat: add listening history endpoint with upsert + increment"
```

---

## Task 6: Taste-profile prompt

**Files:**
- Create: `XtraTune/src/lib/ai/prompts/taste-profile.ts`
- Create: `XtraTune/tests/lib/ai/prompts/taste-profile.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/lib/ai/prompts/taste-profile.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";

const generateJSONMock = vi.fn();
vi.mock("@/lib/ai/gemini", () => ({ generateJSON: generateJSONMock }));

import { generateTasteProfile } from "@/lib/ai/prompts/taste-profile";

describe("generateTasteProfile", () => {
  it("calls Gemini with top songs and merges deterministic fields", async () => {
    generateJSONMock.mockResolvedValue({
      topGenres: ["bollywood-romantic"],
      topMoods: ["melancholic"],
      vibeDescription: "loves emotional Hindi vocals",
    });
    const out = await generateTasteProfile([
      { title: "Tum Hi Ho", artist: "Arijit Singh", language: "hindi", playCount: 30 },
      { title: "Tum Hi Ho", artist: "Arijit Singh", language: "hindi", playCount: 30 },
      { title: "Channa Mereya", artist: "Arijit Singh", language: "hindi", playCount: 15 },
    ]);
    expect(out.topLanguages).toContain("hindi");
    expect(out.topArtists).toContain("Arijit Singh");
    expect(out.topGenres).toEqual(["bollywood-romantic"]);
    expect(out.vibeDescription).toMatch(/Hindi/i);
    const promptArg = generateJSONMock.mock.calls[0][0] as string;
    expect(promptArg).toContain("Tum Hi Ho");
  });

  it("returns empty defaults when input is empty", async () => {
    const out = await generateTasteProfile([]);
    expect(out.topGenres).toEqual([]);
    expect(out.vibeDescription).toBe("");
    expect(generateJSONMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test, verify failure**

Run: `pnpm vitest run tests/lib/ai/prompts/taste-profile.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/lib/ai/prompts/taste-profile.ts`:

```ts
import { z } from "zod";
import { generateJSON } from "@/lib/ai/gemini";

export interface HistoryRow {
  title: string;
  artist: string;
  language: string;
  playCount: number;
}

export interface TasteProfile {
  topGenres: string[];
  topMoods: string[];
  topLanguages: string[];
  topArtists: string[];
  vibeDescription: string;
}

const aiSchema = z.object({
  topGenres: z.array(z.string()).max(8),
  topMoods: z.array(z.string()).max(8),
  vibeDescription: z.string().max(280),
});

const topByCount = (rows: HistoryRow[], pick: (r: HistoryRow) => string, limit: number) => {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const k = pick(r).trim();
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + r.playCount);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k);
};

export async function generateTasteProfile(rows: HistoryRow[]): Promise<TasteProfile> {
  if (rows.length === 0) {
    return { topGenres: [], topMoods: [], topLanguages: [], topArtists: [], vibeDescription: "" };
  }

  const topLanguages = topByCount(rows, (r) => r.language, 4);
  const topArtists = topByCount(rows, (r) => r.artist, 8);

  const list = rows
    .slice(0, 30)
    .map((r) => `- "${r.title}" by ${r.artist} (${r.language}, played ${r.playCount}x)`)
    .join("\n");

  const prompt = `You are a music taste analyst. Given a user's top songs, infer:
- topGenres: 3-6 short kebab-case genres (e.g. "bollywood-romantic", "punjabi-pop", "indie-rock")
- topMoods: 3-6 short kebab-case moods (e.g. "upbeat", "melancholic", "energetic")
- vibeDescription: ONE sentence (≤200 chars) describing the listener's overall musical taste

Songs:
${list}

Return ONLY JSON matching this shape:
{"topGenres":["..."],"topMoods":["..."],"vibeDescription":"..."}`;

  const ai = await generateJSON(prompt, aiSchema);
  return {
    topGenres: ai.topGenres,
    topMoods: ai.topMoods,
    topLanguages,
    topArtists,
    vibeDescription: ai.vibeDescription,
  };
}
```

- [ ] **Step 4: Run test, verify pass**

Run: `pnpm vitest run tests/lib/ai/prompts/taste-profile.test.ts`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/prompts/taste-profile.ts tests/lib/ai/prompts/taste-profile.test.ts
git commit -m "feat: add taste-profile Gemini prompt"
```

---

## Task 7: Re-rank/explain prompt

**Files:**
- Create: `XtraTune/src/lib/ai/prompts/rerank.ts`
- Create: `XtraTune/tests/lib/ai/prompts/rerank.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/lib/ai/prompts/rerank.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";

const generateJSONMock = vi.fn();
vi.mock("@/lib/ai/gemini", () => ({ generateJSON: generateJSONMock }));

import { rerankCandidates } from "@/lib/ai/prompts/rerank";

const sampleProfile = {
  topGenres: ["punjabi-pop"],
  topMoods: ["upbeat"],
  topLanguages: ["punjabi"],
  topArtists: ["Diljit Dosanjh"],
  vibeDescription: "Loves driving Punjabi anthems",
};

describe("rerankCandidates", () => {
  it("returns ranked candidates filtered by known songIds", async () => {
    generateJSONMock.mockResolvedValue({
      ranked: [
        { songId: "s1", score: 92, reason: "Driving Punjabi pop" },
        { songId: "ghost", score: 50, reason: "ignored" },
        { songId: "s2", score: 80, reason: "Upbeat anthem" },
      ],
    });
    const out = await rerankCandidates(sampleProfile, [
      { songId: "s1", title: "T1", artist: "A1" },
      { songId: "s2", title: "T2", artist: "A2" },
    ]);
    expect(out).toEqual([
      { songId: "s1", score: 92, reason: "Driving Punjabi pop" },
      { songId: "s2", score: 80, reason: "Upbeat anthem" },
    ]);
  });

  it("returns empty array on empty candidates", async () => {
    const out = await rerankCandidates(sampleProfile, []);
    expect(out).toEqual([]);
    expect(generateJSONMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test, verify failure**

Run: `pnpm vitest run tests/lib/ai/prompts/rerank.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/lib/ai/prompts/rerank.ts`:

```ts
import { z } from "zod";
import { generateJSON } from "@/lib/ai/gemini";
import type { TasteProfile } from "./taste-profile";

export interface Candidate {
  songId: string;
  title: string;
  artist: string;
  language?: string;
}

export interface RankedItem {
  songId: string;
  score: number;
  reason: string;
}

const aiSchema = z.object({
  ranked: z.array(
    z.object({
      songId: z.string(),
      score: z.number(),
      reason: z.string().max(120),
    })
  ),
});

export async function rerankCandidates(
  profile: TasteProfile,
  candidates: Candidate[],
): Promise<RankedItem[]> {
  if (candidates.length === 0) return [];

  const knownIds = new Set(candidates.map((c) => c.songId));
  const list = candidates
    .map((c) => `- id=${c.songId} | "${c.title}" by ${c.artist}${c.language ? ` (${c.language})` : ""}`)
    .join("\n");

  const prompt = `You re-rank candidate songs for a listener and explain each pick.

Listener profile:
- Genres: ${profile.topGenres.join(", ") || "(unknown)"}
- Moods: ${profile.topMoods.join(", ") || "(unknown)"}
- Languages: ${profile.topLanguages.join(", ") || "(unknown)"}
- Top artists: ${profile.topArtists.join(", ") || "(unknown)"}
- Vibe: ${profile.vibeDescription || "(unknown)"}

Candidates:
${list}

For each candidate, give a score 0-100 (higher = better fit) and a one-line reason ≤80 chars,
written conversationally ("Driving Punjabi pop you'd vibe with after Diljit").

Return ONLY JSON:
{"ranked":[{"songId":"...","score":0-100,"reason":"..."}]}
Order by score desc. Include up to 20 entries. Use only ids from the candidate list.`;

  const ai = await generateJSON(prompt, aiSchema);
  return ai.ranked
    .filter((r) => knownIds.has(r.songId))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}
```

- [ ] **Step 4: Run test, verify pass**

Run: `pnpm vitest run tests/lib/ai/prompts/rerank.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/prompts/rerank.ts tests/lib/ai/prompts/rerank.test.ts
git commit -m "feat: add re-rank/explain Gemini prompt"
```

---

## Task 8: Smart-playlists prompt

**Files:**
- Create: `XtraTune/src/lib/ai/prompts/smart-playlists.ts`
- Create: `XtraTune/tests/lib/ai/prompts/smart-playlists.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/lib/ai/prompts/smart-playlists.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";

const generateJSONMock = vi.fn();
vi.mock("@/lib/ai/gemini", () => ({ generateJSON: generateJSONMock }));

import { generateSmartPlaylists } from "@/lib/ai/prompts/smart-playlists";

describe("generateSmartPlaylists", () => {
  it("filters out playlists referencing unknown songIds", async () => {
    generateJSONMock.mockResolvedValue({
      playlists: [
        { name: "P1", description: "d", theme: "t1", songIds: ["s1", "s2"] },
        { name: "P2", description: "d", theme: "t2", songIds: ["bad", "s2"] },
      ],
    });
    const out = await generateSmartPlaylists([
      { songId: "s1", title: "T1", artist: "A1", language: "hindi" },
      { songId: "s2", title: "T2", artist: "A2", language: "hindi" },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0].songIds).toEqual(["s1", "s2"]);
    expect(out[1].songIds).toEqual(["s2"]); // bad id stripped
  });

  it("returns [] for empty history", async () => {
    expect(await generateSmartPlaylists([])).toEqual([]);
    expect(generateJSONMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test, verify failure**

Run: `pnpm vitest run tests/lib/ai/prompts/smart-playlists.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/lib/ai/prompts/smart-playlists.ts`:

```ts
import { z } from "zod";
import { generateJSON } from "@/lib/ai/gemini";

export interface HistoryItem {
  songId: string;
  title: string;
  artist: string;
  language: string;
}

export interface SmartPlaylist {
  name: string;
  description: string;
  theme: string;
  songIds: string[];
}

const aiSchema = z.object({
  playlists: z.array(
    z.object({
      name: z.string().max(60),
      description: z.string().max(160),
      theme: z.string().max(40),
      songIds: z.array(z.string()),
    })
  ).max(6),
});

export async function generateSmartPlaylists(items: HistoryItem[]): Promise<SmartPlaylist[]> {
  if (items.length === 0) return [];

  const known = new Set(items.map((i) => i.songId));
  const list = items
    .slice(0, 60)
    .map((i) => `- id=${i.songId} | "${i.title}" by ${i.artist} (${i.language})`)
    .join("\n");

  const prompt = `Group this listener's songs into 3 to 4 themed playlists.
For each playlist:
- name: catchy, ≤50 chars (e.g. "Late-Night Bollywood Vibes")
- description: ≤120 chars one-liner
- theme: kebab-case slug
- songIds: 8-15 ids from the input list

Songs:
${list}

Return ONLY JSON:
{"playlists":[{"name":"...","description":"...","theme":"...","songIds":["..."]}]}`;

  const ai = await generateJSON(prompt, aiSchema);
  return ai.playlists.map((p) => ({
    ...p,
    songIds: p.songIds.filter((id) => known.has(id)),
  }));
}
```

- [ ] **Step 4: Run test, verify pass**

Run: `pnpm vitest run tests/lib/ai/prompts/smart-playlists.test.ts`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/prompts/smart-playlists.ts tests/lib/ai/prompts/smart-playlists.test.ts
git commit -m "feat: add smart-playlists Gemini prompt"
```

---

## Task 9: Seed scoring + pool hashing helpers

**Files:**
- Create: `XtraTune/src/lib/recommendations/score.ts`
- Create: `XtraTune/tests/lib/recommendations/score.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/lib/recommendations/score.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { scoreHistory, hashCandidatePool } from "@/lib/recommendations/score";

describe("scoreHistory", () => {
  it("favorited songs outrank non-favorites with same plays", () => {
    const ranked = scoreHistory(
      [
        { songId: "a", playCount: 3 },
        { songId: "b", playCount: 3 },
      ],
      new Set(["b"]),
    );
    expect(ranked[0].songId).toBe("b");
  });

  it("caps playCount contribution at 5", () => {
    const ranked = scoreHistory(
      [
        { songId: "a", playCount: 100 },
        { songId: "b", playCount: 5 },
      ],
      new Set(),
    );
    expect(ranked[0].score).toBe(ranked[1].score);
  });
});

describe("hashCandidatePool", () => {
  it("same ids in different order produce same hash", () => {
    expect(hashCandidatePool(["a", "b", "c"])).toBe(hashCandidatePool(["c", "a", "b"]));
  });

  it("different sets produce different hashes", () => {
    expect(hashCandidatePool(["a", "b"])).not.toBe(hashCandidatePool(["a", "c"]));
  });
});
```

- [ ] **Step 2: Run test, verify failure**

Run: `pnpm vitest run tests/lib/recommendations/score.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/lib/recommendations/score.ts`:

```ts
import { createHash } from "crypto";

export interface ScoredHistoryRow {
  songId: string;
  playCount: number;
  score: number;
}

export function scoreHistory(
  rows: { songId: string; playCount: number }[],
  favoriteIds: Set<string>,
): ScoredHistoryRow[] {
  return rows
    .map((r) => ({
      songId: r.songId,
      playCount: r.playCount,
      score: (favoriteIds.has(r.songId) ? 2 : 0) + Math.min(r.playCount, 5),
    }))
    .sort((a, b) => b.score - a.score);
}

export function hashCandidatePool(songIds: string[]): string {
  const sorted = [...songIds].sort().join("|");
  return createHash("sha256").update(sorted).digest("hex");
}
```

- [ ] **Step 4: Run test, verify pass**

Run: `pnpm vitest run tests/lib/recommendations/score.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/recommendations/score.ts tests/lib/recommendations/score.test.ts
git commit -m "feat: add seed scoring + candidate pool hashing"
```

---

## Task 10: Recommendations pipeline orchestrator

**Files:**
- Create: `XtraTune/src/lib/recommendations/pipeline.ts`
- Create: `XtraTune/tests/lib/recommendations/pipeline.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/lib/recommendations/pipeline.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const generateTasteProfile = vi.fn();
const rerankCandidates = vi.fn();
vi.mock("@/lib/ai/prompts/taste-profile", () => ({ generateTasteProfile }));
vi.mock("@/lib/ai/prompts/rerank", () => ({ rerankCandidates }));

import { runRecommendationPipeline } from "@/lib/recommendations/pipeline";

const profile = {
  topGenres: ["pop"], topMoods: ["upbeat"], topLanguages: ["english"],
  topArtists: ["Artist"], vibeDescription: "v",
};

describe("runRecommendationPipeline", () => {
  beforeEach(() => { generateTasteProfile.mockReset(); rerankCandidates.mockReset(); });

  it("returns ranked + reasons given profile and candidates (cold cache)", async () => {
    generateTasteProfile.mockResolvedValue(profile);
    rerankCandidates.mockResolvedValue([
      { songId: "s1", score: 90, reason: "r1" },
      { songId: "s2", score: 80, reason: "r2" },
    ]);
    const out = await runRecommendationPipeline({
      historyTop: [{ songId: "s0", title: "T", artist: "A", language: "en", playCount: 5 }],
      candidates: [
        { songId: "s1", title: "T1", artist: "A1" },
        { songId: "s2", title: "T2", artist: "A2" },
      ],
      cachedProfile: null,
      cachedRanking: null,
    });
    expect(out.source).toBe("ai");
    expect(out.ranked.map((r) => r.songId)).toEqual(["s1", "s2"]);
    expect(out.profile).toEqual(profile);
  });

  it("returns cached ranking when hash matches", async () => {
    const cachedRanking = {
      candidatePoolHash: "deadbeef",
      ranked: [{ songId: "s1", score: 95, reason: "cached" }],
    };
    const out = await runRecommendationPipeline({
      historyTop: [],
      candidates: [{ songId: "s1", title: "T1", artist: "A1" }],
      cachedProfile: profile,
      cachedRanking,
      _testHashOverride: "deadbeef",
    });
    expect(out.source).toBe("cache");
    expect(out.ranked).toEqual(cachedRanking.ranked);
    expect(rerankCandidates).not.toHaveBeenCalled();
  });

  it("falls back to score-only ranking when AI throws", async () => {
    generateTasteProfile.mockResolvedValue(profile);
    rerankCandidates.mockRejectedValue(new Error("quota"));
    const out = await runRecommendationPipeline({
      historyTop: [],
      candidates: [
        { songId: "s1", title: "T1", artist: "A1" },
        { songId: "s2", title: "T2", artist: "A2" },
      ],
      cachedProfile: profile,
      cachedRanking: null,
    });
    expect(out.source).toBe("fallback");
    expect(out.ranked).toHaveLength(2);
    expect(out.ranked[0].reason).toBe("");
  });
});
```

- [ ] **Step 2: Run test, verify failure**

Run: `pnpm vitest run tests/lib/recommendations/pipeline.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/lib/recommendations/pipeline.ts`:

```ts
import { hashCandidatePool } from "./score";
import { generateTasteProfile, type HistoryRow, type TasteProfile } from "@/lib/ai/prompts/taste-profile";
import { rerankCandidates, type Candidate, type RankedItem } from "@/lib/ai/prompts/rerank";

export interface PipelineInput {
  historyTop: (HistoryRow & { songId: string })[];
  candidates: Candidate[];
  cachedProfile: TasteProfile | null;
  cachedRanking: { candidatePoolHash: string; ranked: RankedItem[] } | null;
  _testHashOverride?: string;
}

export interface PipelineOutput {
  source: "ai" | "cache" | "fallback";
  profile: TasteProfile;
  ranked: RankedItem[];
  candidatePoolHash: string;
}

export async function runRecommendationPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const candidatePoolHash =
    input._testHashOverride ?? hashCandidatePool(input.candidates.map((c) => c.songId));

  const profile =
    input.cachedProfile ??
    (await generateTasteProfile(input.historyTop));

  if (input.cachedRanking && input.cachedRanking.candidatePoolHash === candidatePoolHash) {
    return { source: "cache", profile, ranked: input.cachedRanking.ranked, candidatePoolHash };
  }

  try {
    const ranked = await rerankCandidates(profile, input.candidates);
    return { source: "ai", profile, ranked, candidatePoolHash };
  } catch (err) {
    console.error("[recommendations] rerank failed, falling back:", err);
    const ranked: RankedItem[] = input.candidates.map((c, i) => ({
      songId: c.songId,
      score: 100 - i,
      reason: "",
    }));
    return { source: "fallback", profile, ranked, candidatePoolHash };
  }
}
```

- [ ] **Step 4: Run test, verify pass**

Run: `pnpm vitest run tests/lib/recommendations/pipeline.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/recommendations/pipeline.ts tests/lib/recommendations/pipeline.test.ts
git commit -m "feat: add recommendations pipeline with cache + fallback"
```

---

## Task 11: `/api/recommendations` route

**Files:**
- Create: `XtraTune/src/app/api/recommendations/route.ts`

- [ ] **Step 1: Implement the route**

Create `src/app/api/recommendations/route.ts`:

```ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { gethomepageData } from "@/utils/get-home-data";
import { scoreHistory } from "@/lib/recommendations/score";
import { runRecommendationPipeline } from "@/lib/recommendations/pipeline";
import { music } from "@/lib/music";
import type {
  ListeningHistoryDoc, TasteProfileDoc, RecommendationCacheDoc,
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

  const history = await db.collection<ListeningHistoryDoc>("listening_history")
    .find({ userId: session.userId }).sort({ playCount: -1 }).limit(60).toArray();

  if (history.length < 5) return guestFallback();

  const favs = await db.collection("user_favorites")
    .findOne({ userId: session.userId, type: "track" });
  const favIds = new Set<string>(favs?.ids ?? []);

  const scored = scoreHistory(
    history.map((h) => ({ songId: h.songId, playCount: h.playCount })),
    favIds,
  );
  const seedIds = scored.slice(0, SEED_COUNT).map((s) => s.songId);

  const seedResults = await Promise.all(seedIds.map(fetchSuggestionsFor));
  const flatten = seedResults.flat();
  const seenIds = new Set([...seedIds, ...favIds]);
  const candidatesAll = flatten.filter((c) => {
    if (!c.songId || seenIds.has(c.songId)) return false;
    seenIds.add(c.songId);
    return true;
  }).slice(0, CANDIDATE_LIMIT);

  if (candidatesAll.length === 0) return guestFallback();

  const cachedProfileDoc = await db.collection<TasteProfileDoc>("taste_profiles")
    .findOne({ userId: session.userId });
  const cachedRankingDoc = await db.collection<RecommendationCacheDoc>("recommendation_cache")
    .findOne({ userId: session.userId });

  const stale = isStaleProfile(cachedProfileDoc, history.length);
  const cachedProfile = !stale && cachedProfileDoc ? cachedProfileDoc.profile : null;

  const cachedRanking = cachedRankingDoc &&
    (Date.now() - new Date(cachedRankingDoc.generatedAt).getTime()) < 24 * 60 * 60 * 1000
    ? { candidatePoolHash: cachedRankingDoc.candidatePoolHash, ranked: cachedRankingDoc.ranked }
    : null;

  const result = await runRecommendationPipeline({
    historyTop: history.map((h) => ({
      songId: h.songId, title: h.title, artist: h.artist,
      language: h.language, playCount: h.playCount,
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
```

- [ ] **Step 2: Type-check**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Smoke test**

Run: `pnpm dev`. Visit `/api/recommendations` while logged-in with ≥5 history entries.
Expected: JSON `{ source: "ai" | "cache" | "fallback", items: [...] }` with songs and `reason` strings.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/recommendations/route.ts
git commit -m "feat: add /api/recommendations endpoint with caching"
```

---

## Task 12: `/api/smart-playlists` + `/api/recommendations/refresh` routes

**Files:**
- Create: `XtraTune/src/app/api/smart-playlists/route.ts`
- Create: `XtraTune/src/app/api/recommendations/refresh/route.ts`

- [ ] **Step 1: Implement smart-playlists route**

Create `src/app/api/smart-playlists/route.ts`:

```ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { gethomepageData } from "@/utils/get-home-data";
import { generateSmartPlaylists } from "@/lib/ai/prompts/smart-playlists";
import type { ListeningHistoryDoc, SmartPlaylistsDoc } from "@/lib/db-schema";

const TTL_DAYS = 7;

const guestFallback = async () => {
  const home = await gethomepageData();
  return NextResponse.json({
    source: "guest",
    playlists: (home?.data.playlists ?? []).slice(0, 4).map((p: any) => ({
      name: p.title, description: p.subtitle ?? "",
      theme: "trending", songIds: [], image: p.image,
    })),
  });
};

export async function GET() {
  const session = getSession();
  if (!session) return guestFallback();

  const client = await clientPromise;
  const db = client.db();

  const cached = await db.collection<SmartPlaylistsDoc>("smart_playlists")
    .findOne({ userId: session.userId });
  const fresh =
    cached &&
    (Date.now() - new Date(cached.generatedAt).getTime()) < TTL_DAYS * 24 * 60 * 60 * 1000;
  if (fresh) {
    return NextResponse.json({ source: "cache", playlists: cached.playlists });
  }

  const history = await db.collection<ListeningHistoryDoc>("listening_history")
    .find({ userId: session.userId }).sort({ playCount: -1 }).limit(60).toArray();
  if (history.length < 8) return guestFallback();

  let playlists;
  try {
    playlists = await generateSmartPlaylists(
      history.map((h) => ({
        songId: h.songId, title: h.title, artist: h.artist, language: h.language,
      })),
    );
  } catch (err) {
    console.error("[smart-playlists] generation failed:", err);
    return guestFallback();
  }

  await db.collection<SmartPlaylistsDoc>("smart_playlists").updateOne(
    { userId: session.userId },
    { $set: { playlists, generatedAt: new Date() }, $setOnInsert: { userId: session.userId } },
    { upsert: true },
  );

  return NextResponse.json({ source: "ai", playlists });
}
```

- [ ] **Step 2: Implement refresh route**

Create `src/app/api/recommendations/refresh/route.ts`:

```ts
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
```

- [ ] **Step 3: Smoke test**

Run: `pnpm dev`. Hit `/api/smart-playlists` (logged-in). Hit `/api/recommendations/refresh` via:

```js
fetch("/api/recommendations/refresh", { method: "POST", credentials: "same-origin" })
```

Expected: `{ ok: true }`. Re-hit `/api/recommendations` and confirm `source: "ai"` (regenerated).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/smart-playlists/route.ts src/app/api/recommendations/refresh/route.ts
git commit -m "feat: add /api/smart-playlists + /api/recommendations/refresh"
```

---

## Task 13: Web — listening-history client hook + Player wiring

**Files:**
- Create: `XtraTune/src/hooks/use-listening-history.ts`
- Modify: `XtraTune/src/components/Player.tsx`

- [ ] **Step 1: Create the hook**

Create `src/hooks/use-listening-history.ts`:

```ts
"use client";

import { useEffect, useRef } from "react";
import { useCsrf, apiFetch } from "./use-csrf";
import { useAuth } from "./use-auth";

interface Song {
  id?: string;
  title: string;
  artist: string;
  language?: string;
}

const THRESHOLD_SECONDS = 30;

export function useListeningHistory(song: Song | null, currentSeconds: number) {
  const { isAuthenticated } = useAuth();
  const csrf = useCsrf();
  const loggedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !song?.id) return;
    if (loggedRef.current === song.id) return;
    if (currentSeconds < THRESHOLD_SECONDS) return;

    loggedRef.current = song.id;
    apiFetch(
      "/api/user/listening-history",
      {
        method: "POST",
        body: JSON.stringify({
          songId: song.id,
          title: song.title,
          artist: song.artist,
          language: song.language ?? "",
        }),
      },
      csrf,
    ).catch(() => {
      loggedRef.current = null; // allow retry on next render
    });
  }, [isAuthenticated, song?.id, song?.title, song?.artist, song?.language, currentSeconds, csrf]);

  // Reset when the song changes
  useEffect(() => {
    if (loggedRef.current && loggedRef.current !== song?.id) {
      loggedRef.current = null;
    }
  }, [song?.id]);
}
```

- [ ] **Step 2: Wire into Player**

Open `src/components/Player.tsx`. Near the other hook calls (`useFavorites`, `usePlayback`, `useAutoplay`), add:

```tsx
import { useListeningHistory } from "@/hooks/use-listening-history";

// inside the component, after currentSong is read from store:
useListeningHistory(
  currentSong
    ? {
        id: currentSong.id,
        title: currentSong.title ?? title,
        artist: currentSong.artist ?? album,
        language: currentSong.language,
      }
    : null,
  Math.floor((sound?.seek?.() as number) ?? barPostion),
);
```

(Place it after `barPostion` is declared. If `currentSong` shape differs, use whichever fields exist — `title`/`primaryArtists`/`language` are the targets.)

- [ ] **Step 3: Smoke test**

Run: `pnpm dev`. Log in, play a song for 35+ seconds, and check MongoDB:

```
db.listening_history.find({ userId: "<your-user-id>" })
```

Expected: a doc for the song with `playCount: 1` and `lastPlayedAt: <recent>`.

Refresh the page and play again — `playCount` becomes 2.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/use-listening-history.ts src/components/Player.tsx
git commit -m "feat(web): log listening history at 30s mark"
```

---

## Task 14: Web — `For You` section on home

**Files:**
- Create: `XtraTune/src/hooks/use-recommendations.ts`
- Create: `XtraTune/src/app/sections/for-you.tsx`
- Modify: `XtraTune/src/app/page.tsx`

- [ ] **Step 1: Create SWR hook**

Create `src/hooks/use-recommendations.ts`:

```ts
"use client";

import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url, { credentials: "same-origin" }).then((r) => r.json());

export function useRecommendations() {
  const { data, error, isLoading, mutate } = useSWR("/api/recommendations", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
  return {
    items: data?.items ?? [],
    source: data?.source ?? null,
    error,
    isLoading,
    refresh: mutate,
  };
}
```

- [ ] **Step 2: Create `for-you` section**

Create `src/app/sections/for-you.tsx`:

```tsx
"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useRecommendations } from "@/hooks/use-recommendations";
import { SongCard } from "@/components/song-card";
import { Skeleton } from "@/components/ui/skeleton";

export function ForYou() {
  const { items, source, isLoading } = useRecommendations();

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="font-cal text-2xl flex items-center gap-2">
          <Sparkles size={20} className="text-primary" /> For You
        </h2>
        <div className="grid grid-flow-col auto-cols-[160px] gap-4 overflow-x-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-40 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-cal text-2xl flex items-center gap-2">
          <Sparkles size={20} className="text-primary" /> For You
          {source === "guest" && (
            <span className="text-xs text-muted-foreground ml-2">(sign in for personalized picks)</span>
          )}
        </h2>
        <Link href="/recommendations" className="text-sm text-primary hover:underline">
          See all
        </Link>
      </div>
      <div className="grid grid-flow-col auto-cols-[160px] gap-4 overflow-x-auto pb-2">
        {items.slice(0, 12).map((item: any) => (
          <div key={item.songId ?? item.id} className="space-y-1">
            <SongCard song={item} />
            {item.reason && (
              <p className="text-xs text-muted-foreground line-clamp-2 px-1">{item.reason}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
```

If `SongCard` does not exist at `@/components/song-card`, look at how `TrendingSongs` renders songs in `src/app/sections/trending-songs.tsx` and reuse the same primitive.

- [ ] **Step 3: Mount on home page**

In `src/app/page.tsx`, import:

```tsx
import { ForYou } from "./sections/for-you";
```

Inside the `<main>` element, immediately above `<TrendingSongs ... />`, add:

```tsx
<ForYou />
```

- [ ] **Step 4: Smoke test**

Run: `pnpm dev`. Visit `/`. Logged-out → "For You" hidden or shows trending fallback. Logged-in with history → personalized songs with reasons under each card.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-recommendations.ts src/app/sections/for-you.tsx src/app/page.tsx
git commit -m "feat(web): add For You section on home"
```

---

## Task 15: Web — Smart Playlists section + dedicated /recommendations page

**Files:**
- Create: `XtraTune/src/hooks/use-smart-playlists.ts`
- Create: `XtraTune/src/app/sections/smart-playlists.tsx`
- Create: `XtraTune/src/app/recommendations/page.tsx`
- Create: `XtraTune/src/app/recommendations/loading.tsx`
- Modify: `XtraTune/src/app/page.tsx`

- [ ] **Step 1: SWR hook**

Create `src/hooks/use-smart-playlists.ts`:

```ts
"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url, { credentials: "same-origin" }).then((r) => r.json());

export function useSmartPlaylists() {
  const { data, isLoading } = useSWR("/api/smart-playlists", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5 * 60 * 1000,
  });
  return { playlists: data?.playlists ?? [], source: data?.source, isLoading };
}
```

- [ ] **Step 2: Section component**

Create `src/app/sections/smart-playlists.tsx`:

```tsx
"use client";

import { Wand2 } from "lucide-react";
import { useSmartPlaylists } from "@/hooks/use-smart-playlists";
import { Skeleton } from "@/components/ui/skeleton";

export function SmartPlaylists() {
  const { playlists, isLoading } = useSmartPlaylists();

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="font-cal text-2xl flex items-center gap-2">
          <Wand2 size={20} className="text-primary" /> Smart Playlists
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!playlists.length) return null;

  return (
    <section className="space-y-4">
      <h2 className="font-cal text-2xl flex items-center gap-2">
        <Wand2 size={20} className="text-primary" /> Smart Playlists
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {playlists.map((p: any) => (
          <div
            key={p.theme ?? p.name}
            className="rounded-xl border bg-gradient-to-br from-primary/10 to-amber-300/10 p-5 space-y-2 hover:from-primary/20 transition"
          >
            <div className="text-xs uppercase tracking-wider text-primary font-semibold">
              {p.theme}
            </div>
            <div className="font-cal text-lg leading-tight">{p.name}</div>
            <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
            <div className="text-xs text-muted-foreground">
              {p.songIds?.length ?? 0} songs
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Dedicated `/recommendations` page**

Create `src/app/recommendations/loading.tsx`:

```tsx
import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <main className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    </main>
  );
}
```

Create `src/app/recommendations/page.tsx`:

```tsx
"use client";

import { Sparkles, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useRecommendations } from "@/hooks/use-recommendations";
import { SongCard } from "@/components/song-card";
import { Button } from "@/components/ui/button";

export default function RecommendationsPage() {
  const { items, isLoading, refresh } = useRecommendations();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetch("/api/recommendations/refresh", {
      method: "POST",
      credentials: "same-origin",
    });
    await refresh();
    setRefreshing(false);
  };

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-cal text-3xl flex items-center gap-2">
          <Sparkles className="text-primary" /> Recommendations
        </h1>
        <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? " Refreshing…" : " Refresh"}
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && items.length === 0 && (
        <div className="rounded-xl border p-10 text-center text-muted-foreground">
          Listen to a few songs and your AI feed will appear here.
        </div>
      )}

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
        {items.map((item: any) => (
          <div key={item.songId ?? item.id} className="space-y-2">
            <SongCard song={item} />
            {item.reason && (
              <p className="text-sm text-muted-foreground line-clamp-3 px-1">{item.reason}</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Mount Smart Playlists section on home**

In `src/app/page.tsx`, import and render below the `<Albums />` block:

```tsx
import { SmartPlaylists } from "./sections/smart-playlists";

// ... inside <main>:
<SmartPlaylists />
```

- [ ] **Step 5: Smoke test**

Run: `pnpm dev`. Visit `/`. The Smart Playlists row appears below Albums (or shows nothing if user has <8 history items). Visit `/recommendations` — full grid. Click Refresh — Gemini regenerates.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/use-smart-playlists.ts src/app/sections/smart-playlists.tsx src/app/recommendations/page.tsx src/app/recommendations/loading.tsx src/app/page.tsx
git commit -m "feat(web): add Smart Playlists section + /recommendations page"
```

---

## Task 16: Mobile — API client functions

**Files:**
- Modify: `XtraTune-App/src/api/index.ts`

- [ ] **Step 1: Append client functions**

At the bottom of `src/api/index.ts`, add:

```ts
// ─── Recommendations ───────────────────────────────

export async function logListeningHistory(payload: {
  songId: string;
  title: string;
  artist: string;
  language?: string;
}): Promise<boolean> {
  try {
    await api.post("/api/user/listening-history", payload);
    return true;
  } catch {
    return false;
  }
}

export interface RecommendedItem {
  songId?: string;
  id?: string;
  title?: string;
  name?: string;
  artist?: string;
  primaryArtists?: string;
  reason?: string;
  image?: { quality?: string; link: string }[];
  downloadUrl?: { quality?: string; link: string }[];
  language?: string;
}

export async function fetchRecommendations(): Promise<{
  source: string;
  items: RecommendedItem[];
}> {
  try {
    const { data } = await api.get("/api/recommendations");
    return { source: data?.source ?? "guest", items: data?.items ?? [] };
  } catch {
    return { source: "guest", items: [] };
  }
}

export async function refreshRecommendations(): Promise<boolean> {
  try {
    await api.post("/api/recommendations/refresh");
    return true;
  } catch {
    return false;
  }
}

export interface SmartPlaylistItem {
  name: string;
  description: string;
  theme: string;
  songIds: string[];
  image?: { quality?: string; link: string }[];
}

export async function fetchSmartPlaylists(): Promise<SmartPlaylistItem[]> {
  try {
    const { data } = await api.get("/api/smart-playlists");
    return data?.playlists ?? [];
  } catch {
    return [];
  }
}
```

- [ ] **Step 2: Type-check**

Run from `XtraTune-App/`:

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/api/index.ts
git commit -m "feat(mobile): add recommendations + history API client functions"
```

---

## Task 17: Mobile — listening history hook + Player wiring

**Files:**
- Create: `XtraTune-App/src/hooks/useListeningHistory.ts`
- Modify: `XtraTune-App/src/components/player/FullScreenPlayer.tsx` (and/or `MiniPlayer.tsx` — wherever the play position is read)

- [ ] **Step 1: Create the hook**

Create `src/hooks/useListeningHistory.ts`:

```ts
import { useEffect, useRef } from "react";
import { logListeningHistory } from "@/api";
import { useAppSelector } from "@/store/hooks";

const THRESHOLD = 30;

export function useListeningHistory(positionSec: number) {
  const currentSong = useAppSelector((s: any) => s.player.currentSong);
  const isAuthed = useAppSelector((s: any) => Boolean(s.auth?.user));
  const loggedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthed) return;
    if (!currentSong?.id) return;
    if (loggedRef.current === currentSong.id) return;
    if (positionSec < THRESHOLD) return;

    loggedRef.current = currentSong.id;
    logListeningHistory({
      songId: currentSong.id,
      title: currentSong.title ?? currentSong.name ?? "",
      artist: currentSong.primaryArtists ?? currentSong.artist ?? "",
      language: currentSong.language ?? "",
    }).catch(() => { loggedRef.current = null; });
  }, [isAuthed, currentSong?.id, positionSec]);

  useEffect(() => {
    if (loggedRef.current && loggedRef.current !== currentSong?.id) {
      loggedRef.current = null;
    }
  }, [currentSong?.id]);
}
```

If your auth slice is named differently (not `s.auth`), update accordingly. If unsure, search for an existing hook (e.g., `useAuth`) and use its `isAuthenticated` value via the existing pattern.

- [ ] **Step 2: Wire into FullScreenPlayer**

Open `src/components/player/FullScreenPlayer.tsx`. Find where playback position is updated (likely from `expo-av`'s `onPlaybackStatusUpdate`, exposed as a state or selector). Add:

```tsx
import { useListeningHistory } from "@/hooks/useListeningHistory";

// inside the component, where positionMillis is available:
useListeningHistory(Math.floor((positionMillis ?? 0) / 1000));
```

If `positionMillis` lives in Redux instead of local state, read it with `useAppSelector((s) => s.player.position)`.

- [ ] **Step 3: Smoke test**

Run: `yarn start`, open the app on a device, log in, play a song for 35+ seconds. Hit the web `/api/user/listening-history` GET to verify the entry was created.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useListeningHistory.ts src/components/player/FullScreenPlayer.tsx
git commit -m "feat(mobile): log listening history at 30s mark"
```

---

## Task 18: Mobile — For You + Smart Playlists sections on home

**Files:**
- Create: `XtraTune-App/src/components/home/ForYouSection.tsx`
- Create: `XtraTune-App/src/components/home/SmartPlaylistsSection.tsx`
- Modify: `XtraTune-App/app/(drawer)/(tabs)/index.tsx`

- [ ] **Step 1: ForYouSection**

Create `src/components/home/ForYouSection.tsx`:

```tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTheme, Spacing, FontSize } from "@/theme";
import { fetchRecommendations, type RecommendedItem } from "@/api";
import SongCard from "@/components/common/SongCard";

export default function ForYouSection() {
  const { colors } = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<RecommendedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchRecommendations().then((res) => {
      if (alive) {
        setItems(res.items);
        setLoading(false);
      }
    });
    return () => { alive = false; };
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>For You</Text>
        <TouchableOpacity onPress={() => router.push("/recommendations")}>
          <Text style={{ color: colors.primary }}>See all</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        horizontal
        data={items.slice(0, 12)}
        keyExtractor={(it) => it.songId ?? it.id ?? Math.random().toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.md }}
        renderItem={({ item }) => (
          <View style={{ width: 140, marginRight: Spacing.md }}>
            <SongCard song={item as any} />
            {item.reason ? (
              <Text
                numberOfLines={2}
                style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: 4 }}
              >
                {item.reason}
              </Text>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: Spacing.lg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  title: { fontSize: FontSize.xl, fontWeight: "700" },
});
```

- [ ] **Step 2: SmartPlaylistsSection**

Create `src/components/home/SmartPlaylistsSection.tsx`:

```tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTheme, Spacing, FontSize } from "@/theme";
import { fetchSmartPlaylists, type SmartPlaylistItem } from "@/api";

export default function SmartPlaylistsSection() {
  const { colors } = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<SmartPlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchSmartPlaylists().then((res) => {
      if (alive) { setItems(res); setLoading(false); }
    });
    return () => { alive = false; };
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Smart Playlists</Text>
        <TouchableOpacity onPress={() => router.push("/smart-playlists")}>
          <Text style={{ color: colors.primary }}>See all</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(p) => p.theme ?? p.name}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.md }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.theme, { color: colors.primary }]}>
              {item.theme.toUpperCase()}
            </Text>
            <Text numberOfLines={2} style={[styles.name, { color: colors.text }]}>
              {item.name}
            </Text>
            <Text numberOfLines={2} style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>
              {item.description}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: 4 }}>
              {item.songIds.length} songs
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: Spacing.lg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  title: { fontSize: FontSize.xl, fontWeight: "700" },
  card: {
    width: 220,
    padding: Spacing.md,
    marginRight: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
  },
  theme: { fontSize: FontSize.xs, fontWeight: "700", letterSpacing: 1 },
  name: { fontSize: FontSize.lg, fontWeight: "600", marginTop: 4 },
});
```

- [ ] **Step 3: Mount on home**

Open `app/(drawer)/(tabs)/index.tsx`. Import:

```tsx
import ForYouSection from "@/components/home/ForYouSection";
import SmartPlaylistsSection from "@/components/home/SmartPlaylistsSection";
```

Inside the `<ScrollView>`, before the existing trending section, render `<ForYouSection />`. After albums/playlists sections, render `<SmartPlaylistsSection />`.

- [ ] **Step 4: Smoke test**

Run: `yarn start`. Open on a device. Log in (or run with a logged-in user), and confirm the For You row + Smart Playlists row render. Songs should have AI reasons under them.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/ForYouSection.tsx src/components/home/SmartPlaylistsSection.tsx 'app/(drawer)/(tabs)/index.tsx'
git commit -m "feat(mobile): add For You + Smart Playlists sections on home"
```

---

## Task 19: Mobile — `/recommendations` and `/smart-playlists` screens

**Files:**
- Create: `XtraTune-App/app/recommendations.tsx`
- Create: `XtraTune-App/app/smart-playlists.tsx`

- [ ] **Step 1: `/recommendations` screen**

Create `app/recommendations.tsx`:

```tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme, Spacing, FontSize } from "@/theme";
import {
  fetchRecommendations,
  refreshRecommendations,
  type RecommendedItem,
} from "@/api";
import SongCard from "@/components/common/SongCard";

export default function RecommendationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<RecommendedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await fetchRecommendations();
    setItems(res.items);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshRecommendations();
    await load();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: Spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Recommendations</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading && <Text style={{ color: colors.textSecondary }}>Loading…</Text>}
      {!loading && items.length === 0 && (
        <Text style={{ color: colors.textSecondary, marginTop: Spacing.lg }}>
          Listen to a few songs and your AI feed will appear here.
        </Text>
      )}

      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.songId ?? item.id} style={styles.gridItem}>
            <SongCard song={item as any} />
            {item.reason ? (
              <Text
                numberOfLines={3}
                style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: 4 }}
              >
                {item.reason}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  title: { fontSize: FontSize.xxl, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridItem: { width: "48%", marginBottom: Spacing.md },
});
```

- [ ] **Step 2: `/smart-playlists` screen**

Create `app/smart-playlists.tsx`:

```tsx
import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme, Spacing, FontSize } from "@/theme";
import { fetchSmartPlaylists, type SmartPlaylistItem } from "@/api";

export default function SmartPlaylistsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<SmartPlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSmartPlaylists().then((res) => {
      setItems(res); setLoading(false);
    });
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: Spacing.md }}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Smart Playlists</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading && <Text style={{ color: colors.textSecondary }}>Loading…</Text>}
      {!loading && items.length === 0 && (
        <Text style={{ color: colors.textSecondary }}>
          Listen to more songs and we'll generate themed playlists for you.
        </Text>
      )}

      {items.map((p) => (
        <View
          key={p.theme ?? p.name}
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.theme, { color: colors.primary }]}>
            {p.theme.toUpperCase()}
          </Text>
          <Text style={[styles.name, { color: colors.text }]}>{p.name}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>
            {p.description}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: 4 }}>
            {p.songIds.length} songs
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  title: { fontSize: FontSize.xxl, fontWeight: "700" },
  card: {
    padding: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  theme: { fontSize: FontSize.xs, fontWeight: "700", letterSpacing: 1 },
  name: { fontSize: FontSize.lg, fontWeight: "600", marginTop: 4, marginBottom: 6 },
});
```

- [ ] **Step 3: Smoke test**

Run: `yarn start`. From home, tap "See all" on For You → `/recommendations` opens. Tap "See all" on Smart Playlists → `/smart-playlists` opens. Pull-to-refresh on recommendations forces regeneration.

- [ ] **Step 4: Commit**

```bash
git add app/recommendations.tsx app/smart-playlists.tsx
git commit -m "feat(mobile): add /recommendations and /smart-playlists screens"
```

---

## Task 20: End-to-end smoke test

**Files:** none (test-only).

- [ ] **Step 1: Set Gemini key locally**

Add `GEMINI_API_KEY=...` to `XtraTune/.env.local` using a key from https://aistudio.google.com/app/apikey.

- [ ] **Step 2: Run web**

Run: `cd XtraTune && pnpm dev`.

- [ ] **Step 3: Seed listening history**

Log in to the web app. Play 8+ different songs for 35+ seconds each across multiple genres/languages.

- [ ] **Step 4: Verify "For You" row on home**

Refresh `/`. Confirm the For You row shows ~12 songs, each with a one-line AI reason.

- [ ] **Step 5: Verify Smart Playlists row**

Confirm 3-4 themed playlist cards render below Albums.

- [ ] **Step 6: Verify dedicated page**

Visit `/recommendations`. Click Refresh. Confirm a fresh AI call (check server logs for `gemini` activity).

- [ ] **Step 7: Verify mobile**

Run `cd XtraTune-App && yarn start`. Open on device with same logged-in user. Confirm For You + Smart Playlists render.

- [ ] **Step 8: Verify guest fallback**

Log out on web. Confirm `/api/recommendations` returns trending songs (`source: "guest"`).

- [ ] **Step 9: Verify graceful degradation**

In `.env.local`, temporarily set `GEMINI_API_KEY=invalid`. Restart dev. Hit `/api/recommendations`. Confirm it returns items with empty `reason` strings (`source: "fallback"`) — no crash.

- [ ] **Step 10: Restore env, final commit (if anything was tweaked)**

Restore the real key and commit any small adjustments discovered during smoke testing.

---

## Self-Review

**Spec coverage check** — every spec section maps to ≥1 task:

| Spec § | Task(s) |
|---|---|
| §3 Architecture | 2, 5, 10, 11, 12 |
| §4 Data Model (4 collections) | 2 |
| §5.1 Gemini SDK | 1, 3 |
| §5.2 Taste-profile prompt | 6 |
| §5.3 Re-rank prompt | 7 |
| §5.4 Smart-playlists prompt | 8 |
| §5.5 Token budget | enforced via §10 guardrails (Task 4 + caches) |
| §6 Pipeline | 9, 10, 11 |
| §7 API endpoints (5 routes) | 5, 11, 12 |
| §8 Web frontend | 13, 14, 15 |
| §9 Mobile frontend | 16, 17, 18, 19 |
| §10 Guardrails | Task 4 (process-wide RPM bucket); 24h rerank cache + 7d profile/playlist cache (Tasks 11, 12) cover lazy-generation/eager-caching; AI is skipped for guests in routes (Tasks 11, 12) |
| §11 Error handling | Task 10 (fallback path); Tasks 11/12 wrap Gemini calls in try/catch |
| §12 Telemetry | partial — `console.error` on failures only (see "Known gaps") |
| §15 Success criteria | Task 20 |

**Known gaps (deferred — not blocking v1 launch):**

1. **Per-user 5/day cap** (spec §10): not separately enforced. The 24h `recommendation_cache` already prevents repeat re-ranks for a user with the same candidate pool, which approximates the cap in practice. If quota pressure shows up in dogfood, add a `requestCount` field to `taste_profiles` keyed by date.
2. **Structured telemetry events** (`recs.served`, `gemini.call`, `history.write`): only ad-hoc `console.error` is wired. Add a thin `src/lib/telemetry.ts` later if needed; doesn't change feature behavior.

**Placeholder scan:** no `TODO`, `TBD`, or `implement later` markers in any task body. Each task is fully specified — code is paste-ready.

**Type consistency check:**
- `HistoryRow` (taste-profile) ↔ pipeline input ↔ `ListeningHistoryDoc` projection: all share `{title, artist, language, playCount}` plus `songId` where needed. ✓
- `Candidate` (rerank) ↔ pipeline candidates ↔ route's mapped suggestions: `{songId, title, artist, language?}`. ✓
- `RankedItem` ↔ `RecommendationCacheDoc.ranked`: `{songId, score, reason}`. ✓
- `SmartPlaylist` (prompt output) ↔ `SmartPlaylistsDoc.playlists[]`: `{name, description, theme, songIds}`. ✓

**TDD discipline:** every backend logic task (3, 4, 5, 6, 7, 8, 9, 10) has the failing-test → impl → passing-test → commit cycle. UI tasks (11–19) use manual smoke tests because the project has no React/RN test setup; that's an explicit, owned tradeoff documented in the Conventions block.

Plan is ready to execute.
