import { rerankCandidates, type Candidate, type RankedItem } from "@/lib/ai/prompts/rerank";
import {
  generateTasteProfile,
  type HistoryRow,
  type TasteProfile,
} from "@/lib/ai/prompts/taste-profile";
import { hashCandidatePool } from "./score";

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

  const profile = input.cachedProfile ?? (await generateTasteProfile(input.historyTop));

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
