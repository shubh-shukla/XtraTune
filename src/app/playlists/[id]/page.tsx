"use client";

import { Play, Trash2, Music2, ArrowLeft, GripVertical } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useUserPlaylists } from "@/hooks/use-user-playlists";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/store/hooks";
import { setPlaylist } from "@/store/player-slice";

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { status } = useSession();
  const { playlists, isLoading, removeSong, reorderSongs, deletePlaylist } = useUserPlaylists();
  const dispatch = useAppDispatch();

  const playlist = playlists.find((p) => p.id === id);

  // Drag & drop reorder state
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIdx: number) => {
      e.preventDefault();
      if (dragIdx === null || dragIdx === targetIdx || !playlist) return;
      const songs = [...playlist.songs];
      const [moved] = songs.splice(dragIdx, 1);
      songs.splice(targetIdx, 0, moved);
      reorderSongs(playlist.id, songs);
      setDragIdx(null);
      setOverIdx(null);
    },
    [dragIdx, playlist, reorderSongs],
  );

  const handlePlayAll = (startIdx = 0) => {
    if (!playlist?.songs.length) return;
    dispatch(
      setPlaylist({
        playlist: playlist.songs.map((s) => ({
          id: s.id,
          title: s.title,
          artist: s.artist,
          image: s.image,
          duration: s.duration,
        })),
        index: startIdx,
      }),
    );
  };

  const handleDeletePlaylist = async () => {
    if (!playlist) return;
    if (!window.confirm(`Delete "${playlist.name}"?`)) return;
    await deletePlaylist(playlist.id);
    router.push("/playlists");
  };

  if (status === "unauthenticated") {
    router.push("/playlists");
    return null;
  }

  if (isLoading) {
    return (
      <div className="px-2 sm:px-4 py-6 max-w-3xl mx-auto animate-pulse">
        <div className="h-6 w-32 bg-muted rounded mb-6" />
        <div className="flex gap-6 mb-8">
          <div className="h-40 w-40 bg-muted rounded-xl" />
          <div className="flex-1 space-y-3 pt-4">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-lg mb-2" />
        ))}
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-muted-foreground">Playlist not found</p>
        <Link href="/playlists">
          <Button variant="outline">Back to Playlists</Button>
        </Link>
      </div>
    );
  }

  const coverImage = playlist.songs[0]?.image ?? "";

  return (
    <div className="px-2 sm:px-4 py-6 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/playlists"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Playlists
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        <div className="shrink-0 relative h-40 w-40 rounded-xl overflow-hidden bg-muted mx-auto sm:mx-0">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={playlist.name}
              fill
              className="object-cover"
              sizes="160px"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Music2 className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center text-center sm:text-left">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Playlist</p>
          <h1 className="text-2xl sm:text-3xl font-cal mb-2">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-sm text-muted-foreground mb-3">{playlist.description}</p>
          )}
          <p className="text-sm text-muted-foreground mb-4">
            {playlist.songCount} song{playlist.songCount !== 1 ? "s" : ""}
          </p>
          <div className="flex gap-2 justify-center sm:justify-start">
            {playlist.songs.length > 0 && (
              <Button className="gap-2" onClick={() => handlePlayAll()}>
                <Play className="h-4 w-4 fill-current" />
                Play All
              </Button>
            )}
            <Button
              variant="outline"
              className="gap-2 text-destructive"
              onClick={handleDeletePlaylist}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Song list */}
      {playlist.songs.length === 0 ? (
        <div className="text-center py-12">
          <Music2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">
            This playlist is empty. Add songs from any track&apos;s menu.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {playlist.songs.map((song, idx) => (
            <div
              key={song.id}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIdx(idx);
              }}
              onDragLeave={() => setOverIdx(null)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={() => {
                setDragIdx(null);
                setOverIdx(null);
              }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-colors hover:bg-muted/60",
                overIdx === idx && "ring-2 ring-primary/40",
                dragIdx === idx && "opacity-50",
              )}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100 shrink-0" />
              <span className="w-6 text-xs text-muted-foreground text-right shrink-0">
                {idx + 1}
              </span>
              <div
                className="relative h-10 w-10 rounded overflow-hidden bg-muted shrink-0 cursor-pointer"
                onClick={() => handlePlayAll(idx)}
              >
                {song.image ? (
                  <Image
                    src={song.image}
                    alt={song.title}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Music2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="h-4 w-4 text-white fill-current" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{song.title}</p>
                <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {song.duration > 0
                  ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(
                      2,
                      "0",
                    )}`
                  : ""}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive shrink-0"
                onClick={() => removeSong(playlist.id, song.id)}
                title="Remove from playlist"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
