import { z } from "zod";
import { generateJSON } from "@/lib/ai/gemini";

export interface HistoryItem {
  songId: string;
  title: string;
  artist: string;
  language: string;
}

export interface SmartPlaylist {
  name: string;
  description: string;
  theme: string;
  songIds: string[];
}

const aiSchema = z.object({
  playlists: z
    .array(
      z.object({
        name: z.string().max(60),
        description: z.string().max(160),
        theme: z.string().max(40),
        songIds: z.array(z.string()),
      }),
    )
    .max(6),
});

export async function generateSmartPlaylists(items: HistoryItem[]): Promise<SmartPlaylist[]> {
  if (items.length === 0) return [];

  const known = new Set(items.map((i) => i.songId));
  const list = items
    .slice(0, 60)
    .map((i) => `- id=${i.songId} | "${i.title}" by ${i.artist} (${i.language})`)
    .join("\n");

  const prompt = `Group this listener's songs into 3 to 4 themed playlists.
For each playlist:
- name: catchy, ≤50 chars (e.g. "Late-Night Bollywood Vibes")
- description: ≤120 chars one-liner
- theme: kebab-case slug
- songIds: 8-15 ids from the input list

Songs:
${list}

Return ONLY JSON:
{"playlists":[{"name":"...","description":"...","theme":"...","songIds":["..."]}]}`;

  const ai = await generateJSON(prompt, aiSchema);
  return ai.playlists.map((p) => ({
    ...p,
    songIds: p.songIds.filter((id) => known.has(id)),
  }));
}
