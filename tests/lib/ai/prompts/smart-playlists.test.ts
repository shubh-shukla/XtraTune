import { describe, it, expect, vi, beforeEach } from "vitest";

const { generateJSONMock } = vi.hoisted(() => ({ generateJSONMock: vi.fn() }));
vi.mock("@/lib/ai/gemini", () => ({ generateJSON: generateJSONMock }));

import { generateSmartPlaylists } from "@/lib/ai/prompts/smart-playlists";

describe("generateSmartPlaylists", () => {
  beforeEach(() => generateJSONMock.mockReset());

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
    expect(out[1].songIds).toEqual(["s2"]);
  });

  it("returns [] for empty history", async () => {
    expect(await generateSmartPlaylists([])).toEqual([]);
    expect(generateJSONMock).not.toHaveBeenCalled();
  });
});
