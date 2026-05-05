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
