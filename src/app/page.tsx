import { Sparkles, Play, Radio } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { gethomepageData } from "@/utils/get-home-data";
import { Albums } from "./sections/albums";
import { Playlists } from "./sections/playlist";
import { TopCharts } from "./sections/top-charts";
import { TrendingSongs } from "./sections/trending-songs";

export const revalidate = 300; // ISR: regenerate every 5 minutes

export default async function Home() {
  const data = await gethomepageData();

  const songs = data?.data.trending.songs ?? [];
  const trendingAlbums = data?.data.trending.albums ?? [];
  const charts = data?.data.charts ?? [];
  const albums = data?.data.albums ?? [];
  const playlists = data?.data.playlists ?? [];

  return (
    <main className="space-y-14">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-orange-400/15 via-amber-300/20 to-rose-300/15 p-6 sm:p-10 shadow-lg">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_45%)] dark:bg-[radial-gradient(circle_at_top_left,#ffffff22,transparent_40%)]"
          aria-hidden
        />
        <div className="relative space-y-5">
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
              className={buttonVariants({
                className: "gap-2 bg-primary text-primary-foreground hover:bg-primary/90",
              })}
            >
              <Play size={16} /> Start exploring
            </Link>
            <Link
              href="/radio"
              className={buttonVariants({
                variant: "ghost",
                className: "gap-2 text-foreground hover:bg-foreground/10 dark:hover:bg-white/10",
              })}
            >
              <Radio size={16} /> Radio Stations
            </Link>
          </div>
        </div>
      </section>

      <TrendingSongs songs={songs} albums={trendingAlbums} />
      <TopCharts charts={charts} />
      <Albums albums={albums} />
      <Playlists playlists={playlists} />
    </main>
  );
}
