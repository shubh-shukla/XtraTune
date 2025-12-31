import { TrendingSongs } from "./sections/trending-songs";
import { TopCharts } from "./sections/top-charts";
import { Albums } from "./sections/albums";
import { Playlists } from "./sections/playlist";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Sparkles, Play, Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  return (
    <main className="space-y-14">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-orange-400/15 via-amber-300/20 to-rose-300/15 p-6 sm:p-10 shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_45%)] dark:bg-[radial-gradient(circle_at_top_left,#ffffff22,transparent_40%)]" aria-hidden />
        <div className="relative grid gap-6 lg:grid-cols-[2fr,1fr] lg:items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              <Sparkles size={14} /> Fresh drop
            </div>
            <h1 className="font-cal text-4xl sm:text-5xl lg:text-6xl text-foreground leading-tight">
              Groove without limits.
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Dive into trending bops, curated charts, and endless playlists tuned for every vibe.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/categories"
                className={buttonVariants({ className: "gap-2 bg-primary text-primary-foreground hover:bg-primary/90" })}
              >
                <Play size={16} /> Start exploring
              </Link>
              <Link
                href="/search/hits"
                className={buttonVariants({ variant: "ghost", className: "gap-2 text-foreground hover:bg-foreground/10 dark:hover:bg-white/10" })}
              >
                <Search size={16} /> Search anything
              </Link>
            </div>
            <div className="flex flex-wrap gap-3 text-muted-foreground text-sm">
              <span className="rounded-full border border-border px-3 py-1 bg-secondary/70">Top charts refreshed</span>
              <span className="rounded-full border border-border px-3 py-1 bg-secondary/70">Infinite playback</span>
              <span className="rounded-full border border-border px-3 py-1 bg-secondary/70">Dark-mode native</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 self-stretch">
            {["Indie Pulse", "Workout Pump", "Late Night", "Chill Mix"].map((label) => (
              <div
                key={label}
                className="rounded-2xl border border-border bg-card/80 px-4 py-5 text-foreground shadow-inner backdrop-blur"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Playlist</p>
                <p className="font-semibold text-lg">{label}</p>
                <p className="text-xs text-muted-foreground mt-1">Handpicked for you</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TrendingSongs />
      <TopCharts />
      <Albums />
      <Playlists />
    </main>
  );
}
