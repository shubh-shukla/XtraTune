"use client";

import { Wand2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useSmartPlaylists } from "@/hooks/use-smart-playlists";

export function SmartPlaylists() {
  const { playlists, isLoading } = useSmartPlaylists();

  if (isLoading) {
    return (
      <section className="space-y-4 border-none">
        <div className="mt-6 space-y-1">
          <h2 className="text-3xl font-cal font-semibold tracking-wide flex items-center gap-2">
            <Wand2 size={22} className="text-primary" /> Smart Playlists
          </h2>
        </div>
        <Separator className="my-4" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!playlists.length) return null;

  return (
    <section className="space-y-4 border-none">
      <div className="mt-6 space-y-1">
        <h2 className="text-3xl font-cal font-semibold tracking-wide flex items-center gap-2">
          <Wand2 size={22} className="text-primary" /> Smart Playlists
        </h2>
      </div>
      <Separator className="my-4" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {playlists.map((p: any) => (
          <div
            key={p.theme ?? p.name}
            className="rounded-xl border bg-gradient-to-br from-primary/10 to-amber-300/10 p-5 space-y-2 hover:from-primary/20 transition"
          >
            <div className="text-xs uppercase tracking-wider text-primary font-semibold">
              {p.theme}
            </div>
            <div className="font-cal text-lg leading-tight">{p.name}</div>
            <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
            <div className="text-xs text-muted-foreground">{p.songIds?.length ?? 0} songs</div>
          </div>
        ))}
      </div>
    </section>
  );
}
