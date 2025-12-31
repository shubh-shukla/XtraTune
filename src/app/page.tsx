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
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-orange-500/20 via-amber-400/15 to-pink-500/10 p-6 sm:p-10 shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#ffffff22,transparent_40%)]" aria-hidden />
        <div className="relative grid gap-6 lg:grid-cols-[2fr,1fr] lg:items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
              <Sparkles size={14} /> Fresh drop
            </div>
            <h1 className="font-cal text-4xl sm:text-5xl lg:text-6xl text-white leading-tight">
              Groove without limits.
            </h1>
            <p className="text-white/85 text-lg max-w-2xl">
              Dive into trending bops, curated charts, and endless playlists tuned for every vibe.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/categories"
                className={buttonVariants({ className: "gap-2 bg-white text-slate-900 hover:bg-white/90" })}
              >
                <Play size={16} /> Start exploring
              </Link>
              <Link
                href="/search/hits"
                className={buttonVariants({ variant: "ghost", className: "gap-2 text-white hover:bg-white/10" })}
              >
                <Search size={16} /> Search anything
              </Link>
            </div>
            <div className="flex flex-wrap gap-3 text-white/80 text-sm">
              <span className="rounded-full border border-white/20 px-3 py-1">Top charts refreshed</span>
              <span className="rounded-full border border-white/20 px-3 py-1">Infinite playback</span>
              <span className="rounded-full border border-white/20 px-3 py-1">Dark-mode native</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 self-stretch">
            {["Indie Pulse", "Workout Pump", "Late Night", "Chill Mix"].map((label) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-5 text-white shadow-inner backdrop-blur"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Playlist</p>
                <p className="font-semibold text-lg">{label}</p>
                <p className="text-xs text-white/70 mt-1">Handpicked for you</p>
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
