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
