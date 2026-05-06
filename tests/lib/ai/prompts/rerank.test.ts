import { describe, it, expect, vi, beforeEach } from "vitest";

const { generateJSONMock } = vi.hoisted(() => ({ generateJSONMock: vi.fn() }));
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
  beforeEach(() => generateJSONMock.mockReset());

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
