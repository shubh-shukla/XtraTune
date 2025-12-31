"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useSongStore } from "@/store/song-store";
import { cn } from "@/lib/utils";
import { Heart, X, GripVertical } from "lucide-react";
import { useLikeStore } from "@/store/likes-store";

const formatDuration = (seconds?: number) => {
  if (!seconds || Number.isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

export const QueuePanel = () => {
  const playlist = useSongStore((state) => state.playlist);
  const current = useSongStore((state) => state.currentSong);
  const setCurrent = useSongStore((state) => state.setCurrentSong);
  const removeAt = useSongStore((state) => state.removeAt);
  const toggleLike = useLikeStore((state) => state.toggleLike);
  const likedTracks = useLikeStore((state) => state.likes.track);
  const [open, setOpen] = useState(false);
  const enterTimer = useRef<NodeJS.Timeout | null>(null);
  const leaveTimer = useRef<NodeJS.Timeout | null>(null);

  const handleEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    enterTimer.current = setTimeout(() => setOpen(true), 40);
  };

  const handleLeave = () => {
    if (enterTimer.current) clearTimeout(enterTimer.current);
    leaveTimer.current = setTimeout(() => setOpen(false), 180);
  };

  if (!playlist.length) return null;

  return (
    <div className="fixed right-2 top-24 z-40 hidden lg:block">
      <div
        className="relative group"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <div className="w-20 transition-all duration-300 ease-out overflow-hidden rounded-2xl border border-border bg-background/90 shadow-2xl backdrop-blur-lg"
          style={{ width: open ? "20rem" : "5rem" }}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
            <span className="text-sm font-semibold">Queue</span>
            <span className="text-xs text-muted-foreground">{playlist.length}</span>
          </div>
          <div className="max-h-[72vh] overflow-auto py-2">
            {playlist.map((song, idx) => {
              const active = idx === current;
              return (
                <button
                  key={`${song.id}-${idx}`}
                  onClick={() => setCurrent(idx)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-primary/5",
                    active && "bg-primary/10"
                  )}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground/70" />
                  <Image
                    src={song.image || "/song-placeholder.webp"}
                    alt={song.title || "song"}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-lg object-cover bg-muted"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium leading-tight truncate",
                        active && "text-primary"
                      )}
                    >
                      {song.title || "Untitled"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {song.artist || "Unknown artist"}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground w-10 text-right">
                    {formatDuration(song.duration)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike("track", song.id);
                    }}
                    aria-label={likedTracks.includes(song.id) ? "Unlike" : "Like"}
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-full transition",
                      likedTracks.includes(song.id)
                        ? "bg-rose-500/15 text-rose-400"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Heart className={cn("h-4 w-4", likedTracks.includes(song.id) && "fill-rose-500 text-rose-400")}/>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAt(idx);
                    }}
                    aria-label="Remove from queue"
                    className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
