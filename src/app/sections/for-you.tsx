"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { SongCard } from "@/components/song-card";
import { HorizontalScroll } from "@/components/ui/horizontal-scroll";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecommendations } from "@/hooks/use-recommendations";

export function ForYou() {
  const { items, source, isLoading } = useRecommendations();

  if (isLoading) {
    return (
      <section className="space-y-4 border-none">
        <div className="mt-6 space-y-1">
          <h2 className="text-3xl font-cal font-semibold tracking-wide flex items-center gap-2">
            <Sparkles size={22} className="text-primary" /> For You
          </h2>
        </div>
        <Separator className="my-4" />
        <div className="flex gap-4 pr-8 overflow-x-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-40 rounded-xl shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section className="space-y-4 border-none">
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-3xl font-cal font-semibold tracking-wide flex items-center gap-2">
          <Sparkles size={22} className="text-primary" /> For You
          {source === "guest" && (
            <span className="text-xs text-muted-foreground ml-2">
              (sign in for personalized picks)
            </span>
          )}
        </h2>
        <Link href="/recommendations" className="text-sm text-primary hover:underline">
          See all
        </Link>
      </div>
      <Separator className="my-4" />
      <HorizontalScroll>
        <div className="flex gap-4 pr-8">
          {items.slice(0, 12).map((item: any) => (
            <div key={item.songId ?? item.id} className="space-y-1 w-40 shrink-0">
              <SongCard
                id={item.songId ?? item.id}
                imageURL={item.image ?? []}
                title={item.title ?? item.name ?? ""}
                type={item.type ?? "song"}
                url={item.url ?? ""}
                artists={item.artist ?? item.primaryArtists ?? ""}
              />
              {item.reason && (
                <p className="text-xs text-muted-foreground line-clamp-2 px-1">{item.reason}</p>
              )}
            </div>
          ))}
        </div>
      </HorizontalScroll>
    </section>
  );
}
