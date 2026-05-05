import { describe, it, expect, vi, beforeEach } from "vitest";

const { generateJSONMock } = vi.hoisted(() => ({ generateJSONMock: vi.fn() }));
vi.mock("@/lib/ai/gemini", () => ({ generateJSON: generateJSONMock }));

import { generateTasteProfile } from "@/lib/ai/prompts/taste-profile";

describe("generateTasteProfile", () => {
  beforeEach(() => generateJSONMock.mockReset());
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
