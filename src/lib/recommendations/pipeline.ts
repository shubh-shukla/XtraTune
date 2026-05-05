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

const EMPTY_PROFILE: TasteProfile = {
  topGenres: [],
  topMoods: [],
  topLanguages: [],
  topArtists: [],
  vibeDescription: "",
};

const scoreOnlyRanking = (candidates: Candidate[]): RankedItem[] =>
  candidates.map((c, i) => ({ songId: c.songId, score: 100 - i, reason: "" }));

export async function runRecommendationPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const candidatePoolHash =
    input._testHashOverride ?? hashCandidatePool(input.candidates.map((c) => c.songId));

  let profile: TasteProfile;
  let profileFailed = false;

  if (input.cachedProfile) {
    profile = input.cachedProfile;
  } else {
    try {
      profile = await generateTasteProfile(input.historyTop);
    } catch (err) {
      console.error("[recommendations] taste profile failed, falling back:", err);
      profile = EMPTY_PROFILE;
      profileFailed = true;
    }
  }

  if (input.cachedRanking && input.cachedRanking.candidatePoolHash === candidatePoolHash) {
    return { source: "cache", profile, ranked: input.cachedRanking.ranked, candidatePoolHash };
  }

  if (profileFailed) {
    return {
      source: "fallback",
      profile,
      ranked: scoreOnlyRanking(input.candidates),
      candidatePoolHash,
    };
  }

  try {
    const ranked = await rerankCandidates(profile, input.candidates);
    return { source: "ai", profile, ranked, candidatePoolHash };
  } catch (err) {
    console.error("[recommendations] rerank failed, falling back:", err);
    return {
      source: "fallback",
      profile,
      ranked: scoreOnlyRanking(input.candidates),
      candidatePoolHash,
    };
  }
}
