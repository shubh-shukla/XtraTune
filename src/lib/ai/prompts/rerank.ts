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
    }),
  ),
});

export async function rerankCandidates(
  profile: TasteProfile,
  candidates: Candidate[],
): Promise<RankedItem[]> {
  if (candidates.length === 0) return [];

  const knownIds = new Set(candidates.map((c) => c.songId));
  const list = candidates
    .map(
      (c) =>
        `- id=${c.songId} | "${c.title}" by ${c.artist}${c.language ? ` (${c.language})` : ""}`,
    )
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
