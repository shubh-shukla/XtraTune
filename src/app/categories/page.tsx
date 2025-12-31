import Link from "next/link";
import { Metadata } from "next";
import { music } from "@/lib/music";
import { AlbumCard } from "@/components/album-card";
import { SongCard } from "@/components/song-card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Browse Categories | XtraTune",
  description: "Discover playlists and albums by mood, activity, and vibe.",
};

const categories = [
  {
    key: "romantic",
    title: "Romantic Evenings",
    query: "romantic",
    blurb: "Slow jams and heartfelt ballads for cozy nights.",
    gradient: "from-rose-500/25 via-amber-300/15 to-orange-400/20",
  },
  {
    key: "workout",
    title: "Workout Pump",
    query: "workout",
    blurb: "High-energy tracks to keep the reps moving.",
    gradient: "from-emerald-400/25 via-lime-300/20 to-cyan-400/20",
  },
  {
    key: "focus",
    title: "Focus & Flow",
    query: "lofi focus",
    blurb: "Instrumentals and mellow tunes for deep work.",
    gradient: "from-sky-400/25 via-indigo-400/20 to-slate-600/20",
  },
  {
    key: "party",
    title: "Party Starters",
    query: "party hits",
    blurb: "Sing-alongs and bangers to light up the room.",
    gradient: "from-fuchsia-500/25 via-purple-400/20 to-blue-400/20",
  },
  {
    key: "indie",
    title: "Indie Fresh",
    query: "indie",
    blurb: "Fresh cuts from rising indie voices.",
    gradient: "from-amber-400/25 via-emerald-300/20 to-teal-400/20",
  },
  {
    key: "retro",
    title: "Retro Gold",
    query: "retro classics",
    blurb: "Timeless hits from the vault.",
    gradient: "from-amber-500/25 via-rose-300/20 to-purple-400/20",
  },
];

const mapImage = (image?: { link?: string; url?: string }[]) => {
  if (!image) return [{ link: "/playlist-placeholder.webp" }];
  return image.map((img) => ({ link: img?.link ?? img?.url ?? "/playlist-placeholder.webp" }));
};

const mapArtists = (value: any) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string")
    return value
      .split(",")
      .map((name) => ({ name: name.trim() }))
      .filter((a) => a.name);
  return [];
};

async function fetchPreviewPlaylists(query: string) {
  const { data } = await music.get(
    `/search/playlists?query=${encodeURIComponent(query)}&page=0&limit=8`
  );
  return (data?.data?.results ?? []).map((p: any) => ({
    id: p.id,
    title: p.name ?? p.title ?? "Untitled",
    image: mapImage(p.image),
    type: p.type ?? "playlist",
    url: p.url ?? "",
    songCount: String(p.songCount ?? ""),
    language: p.language ?? "",
    artists: mapArtists(p.artists ?? p.primaryArtists ?? ""),
  }));
}

async function fetchPreviewSongs(query: string) {
  const { data } = await music.get(
    `/search/songs?query=${encodeURIComponent(query)}&page=0&limit=8`
  );
  return (data?.data?.results ?? []).map((s: any) => ({
    id: s.id,
    title: s.name ?? s.title ?? "Untitled",
    image: mapImage(s.image),
    type: s.type ?? "song",
    url: s.url ?? "",
    singers: s.singers ?? s.primaryArtists ?? "",
    artists: mapArtists(s.artists ?? s.primaryArtists ?? s.singers ?? ""),
  }));
}

export default async function CategoriesPage() {
  const previews = await Promise.all(
    categories.map(async (cat) => ({
      ...cat,
      playlists: await fetchPreviewPlaylists(cat.query),
      songs: await fetchPreviewSongs(cat.query),
    }))
  );

  return (
    <div className="space-y-12 px-4 lg:px-8 py-6">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Browse</p>
        <h1 className="font-cal text-4xl sm:text-5xl">Explore by categories</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Handpicked playlists and albums for every mood, moment, and mission.
        </p>
      </header>
      <nav className="sticky top-16 z-20 backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/90 border border-white/5 rounded-2xl p-3 flex gap-3 overflow-x-auto">
        {categories.map((cat) => (
          <Link
            key={cat.key}
            href={`/categories/${cat.key}`}
            className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium hover:border-orange-400 hover:text-orange-400 transition"
          >
            <span>{cat.title}</span>
          </Link>
        ))}
      </nav>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {previews.map((cat) => (
          <Link
            key={cat.key}
            href={`/categories/${cat.key}`}
            className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br ${cat.gradient} p-5 transition hover:scale-[1.01] hover:shadow-lg`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/80">Category</p>
                <h3 className="text-xl font-semibold text-white drop-shadow-sm">{cat.title}</h3>
                <p className="mt-1 text-sm text-white/80 line-clamp-3">{cat.blurb}</p>
              </div>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white shadow-sm">Open</span>
            </div>
            <div className="mt-6 flex gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs text-white/80">New page</span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs text-white/80">Endless scroll</span>
            </div>
          </Link>
        ))}
      </div>

      {previews.map((cat) => (
        <section key={cat.key} className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Preview</p>
              <h2 className="font-cal text-2xl">{cat.title}</h2>
              <p className="text-muted-foreground text-sm">{cat.blurb}</p>
            </div>
            <Link
              href={`/categories/${cat.key}`}
              className="text-sm text-orange-500 hover:text-orange-400 font-semibold"
            >
              Open full feed
            </Link>
          </div>
          <Separator />
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {cat.playlists.map((item) => (
                <AlbumCard
                  key={item.id}
                  id={item.id}
                  imageURL={item.image}
                  title={item.title}
                  type={item.type}
                  url={item.url}
                  songCount={item.songCount}
                  language={item.language}
                  className="w-[200px]"
                  width={200}
                  height={200}
                  aspectRatio="square"
                  artists={item.artists}
                />
              ))}
              {cat.playlists.length === 0 && (
                <p className="text-muted-foreground">No playlists yet.</p>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {cat.songs.map((song) => (
                <SongCard
                  key={song.id}
                  id={song.id}
                  imageURL={song.image}
                  title={song.title}
                  type={song.type}
                  url={song.url}
                  singer={song.singers}
                  artists={song.artists}
                  aspectRatio="square"
                  width={180}
                  height={180}
                  className="w-[180px]"
                />
              ))}
              {cat.songs.length === 0 && (
                <p className="text-muted-foreground">No songs yet.</p>
              )}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
