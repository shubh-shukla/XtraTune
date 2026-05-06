import { z } from "zod";
import { generateJSON } from "@/lib/ai/gemini";

export interface HistoryRow {
  title: string;
  artist: string;
  language: string;
  playCount: number;
}

export interface TasteProfile {
  topGenres: string[];
  topMoods: string[];
  topLanguages: string[];
  topArtists: string[];
  vibeDescription: string;
}

const aiSchema = z.object({
  topGenres: z.array(z.string()).max(8),
  topMoods: z.array(z.string()).max(8),
  vibeDescription: z.string().max(280),
});

const topByCount = (rows: HistoryRow[], pick: (r: HistoryRow) => string, limit: number) => {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const k = pick(r).trim();
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + r.playCount);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k);
};

export async function generateTasteProfile(rows: HistoryRow[]): Promise<TasteProfile> {
  if (rows.length === 0) {
    return { topGenres: [], topMoods: [], topLanguages: [], topArtists: [], vibeDescription: "" };
  }

  const topLanguages = topByCount(rows, (r) => r.language, 4);
  const topArtists = topByCount(rows, (r) => r.artist, 8);

  const list = rows
    .slice(0, 30)
    .map((r) => `- "${r.title}" by ${r.artist} (${r.language}, played ${r.playCount}x)`)
    .join("\n");

  const prompt = `You are a music taste analyst. Given a user's top songs, infer:
- topGenres: 3-6 short kebab-case genres (e.g. "bollywood-romantic", "punjabi-pop", "indie-rock")
- topMoods: 3-6 short kebab-case moods (e.g. "upbeat", "melancholic", "energetic")
- vibeDescription: ONE sentence (≤200 chars) describing the listener's overall musical taste

Songs:
${list}

Return ONLY JSON matching this shape:
{"topGenres":["..."],"topMoods":["..."],"vibeDescription":"..."}`;

  const ai = await generateJSON(prompt, aiSchema);
  return {
    topGenres: ai.topGenres,
    topMoods: ai.topMoods,
    topLanguages,
    topArtists,
    vibeDescription: ai.vibeDescription,
  };
}
