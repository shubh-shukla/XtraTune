import { CategoryFeed } from "@/components/category-feed";
import { CategorySongFeed } from "@/components/category-song-feed";
import { Metadata } from "next";
import Link from "next/link";

const categories = {
  romantic: {
    title: "Romantic Evenings",
    query: "romantic",
    blurb: "Slow jams and heartfelt ballads for cozy nights.",
  },
  workout: {
    title: "Workout Pump",
    query: "workout",
    blurb: "High-energy tracks to keep the reps moving.",
  },
  focus: {
    title: "Focus & Flow",
    query: "lofi focus",
    blurb: "Instrumentals and mellow tunes for deep work.",
  },
  party: {
    title: "Party Starters",
    query: "party hits",
    blurb: "Sing-alongs and bangers to light up the room.",
  },
  indie: {
    title: "Indie Fresh",
    query: "indie",
    blurb: "Fresh cuts from rising indie voices.",
  },
  retro: {
    title: "Retro Gold",
    query: "retro classics",
    blurb: "Timeless hits from the vault.",
  },
} as const;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const cat = categories[params.slug as keyof typeof categories];
  return {
    title: cat ? `${cat.title} | Categories` : "Categories",
    description: cat?.blurb ?? "Browse playlists by category on XtraTune.",
  };
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const cat = categories[params.slug as keyof typeof categories];

  if (!cat) {
    return (
      <div className="px-4 lg:px-8 py-6 space-y-4">
        <h1 className="font-cal text-3xl">Category not found</h1>
        <p className="text-muted-foreground">Try picking another category.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 lg:px-8 py-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Category</p>
        <h1 className="font-cal text-4xl sm:text-5xl">{cat.title}</h1>
        <p className="text-muted-foreground text-lg max-w-3xl">{cat.blurb}</p>
      </header>

      <nav className="sticky top-16 z-20 backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/90 border border-white/5 rounded-2xl p-3 flex gap-2 overflow-x-auto">
        {Object.entries(categories).map(([key, meta]) => (
          <Link
            key={key}
            href={`/categories/${key}`}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              key === params.slug
                ? "border-orange-400 text-orange-400"
                : "border-white/10 hover:border-orange-400 hover:text-orange-400"
            }`}
          >
            <span>{meta.title}</span>
          </Link>
        ))}
      </nav>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-cal text-2xl">Playlists</h2>
          <p className="text-sm text-muted-foreground">Auto-loads more as you scroll</p>
        </div>
        <CategoryFeed query={cat.query} />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-cal text-2xl">Songs</h2>
          <p className="text-sm text-muted-foreground">Endless songs in this vibe</p>
        </div>
        <CategorySongFeed query={cat.query} />
      </section>
    </div>
  );
}
