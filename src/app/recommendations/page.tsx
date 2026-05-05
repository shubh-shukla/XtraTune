"use client";

import { Sparkles, RefreshCw } from "lucide-react";
import { useState } from "react";
import { SongCard } from "@/components/song-card";
import { Button } from "@/components/ui/button";
import { useRecommendations } from "@/hooks/use-recommendations";

export default function RecommendationsPage() {
  const { items, isLoading, refresh } = useRecommendations();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetch("/api/recommendations/refresh", {
      method: "POST",
      credentials: "same-origin",
    });
    await refresh();
    setRefreshing(false);
  };

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-cal text-3xl flex items-center gap-2">
          <Sparkles className="text-primary" /> Recommendations
        </h1>
        <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? " Refreshing…" : " Refresh"}
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && items.length === 0 && (
        <div className="rounded-xl border p-10 text-center text-muted-foreground">
          Listen to a few songs and your AI feed will appear here.
        </div>
      )}

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
        {items.map((item: any) => (
          <div key={item.songId ?? item.id} className="space-y-2">
            <SongCard
              id={item.songId ?? item.id}
              imageURL={item.image ?? []}
              title={item.title ?? item.name ?? ""}
              type={item.type ?? "song"}
              url={item.url ?? ""}
              artists={item.artist ?? item.primaryArtists ?? ""}
            />
            {item.reason && (
              <p className="text-sm text-muted-foreground line-clamp-3 px-1">{item.reason}</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
