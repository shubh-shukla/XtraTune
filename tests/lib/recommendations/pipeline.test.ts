import { describe, it, expect, vi, beforeEach } from "vitest";

const { generateTasteProfile, rerankCandidates } = vi.hoisted(() => ({
  generateTasteProfile: vi.fn(),
  rerankCandidates: vi.fn(),
}));
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

  it("falls back to score-only ranking when taste-profile generation throws", async () => {
    generateTasteProfile.mockRejectedValue(new Error("gemini quota"));
    const out = await runRecommendationPipeline({
      historyTop: [{ songId: "s0", title: "T", artist: "A", language: "en", playCount: 5 }],
      candidates: [
        { songId: "s1", title: "T1", artist: "A1" },
        { songId: "s2", title: "T2", artist: "A2" },
      ],
      cachedProfile: null,
      cachedRanking: null,
    });
    expect(out.source).toBe("fallback");
    expect(out.ranked).toHaveLength(2);
    expect(out.ranked[0].reason).toBe("");
    expect(out.profile).toEqual({
      topGenres: [],
      topMoods: [],
      topLanguages: [],
      topArtists: [],
      vibeDescription: "",
    });
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
