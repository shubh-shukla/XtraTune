import { Radio } from "lucide-react";
import { type Metadata } from "next";
import { music } from "@/lib/music";
import { StationGrid } from "./station-grid";

export const metadata: Metadata = {
  title: "Radio Stations | XtraTune",
  description: "Curated radio stations for every mood, genre, decade, and artist.",
};

export const dynamic = "force-dynamic";

// ── Station category queries ────────────────────────────────────────
const STATION_SECTIONS: { title: string; emoji: string; queries: string[] }[] = [
  {
    title: "Mood Radio",
    emoji: "🎭",
    queries: [
      "chill vibes hindi",
      "romantic mood",
      "feel good bollywood",
      "sad songs hindi",
      "party hits bollywood",
      "workout pump hindi",
      "late night bollywood",
    ],
  },
  {
    title: "Genre Radio",
    emoji: "🎸",
    queries: [
      "bollywood dance hits",
      "indie pop hindi",
      "sufi hits",
      "punjabi hits",
      "bollywood rock",
      "ghazal classics",
      "devotional hindi",
    ],
  },
  {
    title: "Decade Radio",
    emoji: "📻",
    queries: [
      "best of 90s hindi",
      "hindi 2000s hits",
      "retro bollywood 80s",
      "chartbusters 2025 hindi",
      "old hindi classics 70s",
      "2010s bollywood hits",
      "golden era hindi",
    ],
  },
  {
    title: "Artist Radio",
    emoji: "🎤",
    queries: [
      "arijit singh love songs",
      "let's play shreya ghoshal hindi",
      "let's play kishore kumar hindi",
      "atif aslam hits",
      "a.r. rahman greatest",
      "kumar sanu romantic",
      "neha kakkar hits",
    ],
  },
];

type Station = {
  id: string;
  name: string;
  type: string;
  image: { quality: string; url: string; link?: string }[];
  url: string;
  songCount: number;
  description: string;
};

type StationSection = {
  title: string;
  emoji: string;
  stations: Station[];
};

async function searchPlaylists(query: string, limit = 4): Promise<Station[]> {
  try {
    const { data } = await music.get(
      `/search/playlists?query=${encodeURIComponent(query)}&limit=${limit}`,
    );
    return (data?.data?.results ?? []).map((p: any) => ({
      id: p.id,
      name: p.name ?? p.title ?? "",
      type: p.type ?? "playlist",
      image: p.image ?? [],
      url: p.url ?? "",
      songCount: Number(p.songCount ?? 0),
      description: p.description ?? p.subtitle ?? "",
    }));
  } catch {
    return [];
  }
}

async function getStations(): Promise<StationSection[]> {
  const allQueries = STATION_SECTIONS.flatMap((section) =>
    section.queries.map((q) => ({ section: section.title, emoji: section.emoji, query: q })),
  );

  const results = await Promise.all(allQueries.map(({ query }) => searchPlaylists(query, 3)));

  const seenIds = new Set<string>();
  const sections: StationSection[] = [];

  let idx = 0;
  for (const section of STATION_SECTIONS) {
    const stations: Station[] = [];
    for (const _q of section.queries) {
      const playlists = results[idx++] ?? [];
      for (const p of playlists) {
        if (!seenIds.has(p.id) && p.name && p.image?.length > 0) {
          seenIds.add(p.id);
          stations.push(p);
          break;
        }
      }
    }
    if (stations.length > 0) {
      sections.push({ title: section.title, emoji: section.emoji, stations });
    }
  }

  return sections;
}

export default async function RadioPage() {
  const sections = await getStations();

  return (
    <div className="space-y-10 px-4 lg:px-8 py-6">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-emerald-400/15 via-teal-300/20 to-cyan-300/15 p-6 sm:p-10 shadow-lg">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_45%)] dark:bg-[radial-gradient(circle_at_top_left,#ffffff22,transparent_40%)]"
          aria-hidden
        />
        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
            <Radio size={14} /> Live Stations
          </div>
          <h1 className="font-cal text-4xl sm:text-5xl text-foreground leading-tight">
            Radio Stations
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Handpicked playlists that play like radio — pick a vibe and let the music flow.
          </p>
        </div>
      </header>

      {/* Station sections */}
      {sections.map((section) => (
        <StationGrid key={section.title} section={section} />
      ))}

      {sections.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Radio className="mx-auto h-12 w-12 mb-4 opacity-40" />
          <p className="text-lg">No stations available right now. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
