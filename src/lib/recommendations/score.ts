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
