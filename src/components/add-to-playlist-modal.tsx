"use client";

import { Plus, X, Music2, Check } from "lucide-react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUserPlaylists, type UserPlaylist } from "@/hooks/use-user-playlists";
import { cn } from "@/lib/utils";

interface AddToPlaylistModalProps {
  song: {
    id: string;
    title: string;
    artist: string;
    image: string;
    duration: number;
  };
  open: boolean;
  onClose: () => void;
}

export function AddToPlaylistModal({ song, open, onClose }: AddToPlaylistModalProps) {
  const { playlists, isAuth, createPlaylist, addSong, isLoading } = useUserPlaylists();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  if (!open) return null;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const created = await createPlaylist(newName.trim());
    if (created) {
      // Auto-add the song to the newly created playlist
      await addSong(created.id, song);
      setAdded((prev) => new Set(prev).add(created.id));
    }
    setNewName("");
    setCreating(false);
  };

  const handleAdd = async (playlist: UserPlaylist) => {
    setAdding(playlist.id);
    await addSong(playlist.id, song);
    setAdded((prev) => new Set(prev).add(playlist.id));
    setAdding(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-cal">Add to Playlist</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Song preview */}
        <div className="flex items-center gap-3 px-4 py-3 bg-muted/50">
          {song.image ? (
            <Image
              src={song.image}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
              <Music2 className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{song.title}</p>
            <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
          </div>
        </div>

        {!isAuth ? (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">Sign in to create playlists</p>
            <Button
              onClick={() => signIn(undefined, { callbackUrl: window.location.pathname })}
              variant="default"
            >
              Sign In
            </Button>
          </div>
        ) : (
          <>
            {/* Create new */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="New playlist name..."
                  className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/50"
                  maxLength={100}
                />
                <Button
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                  size="sm"
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Create
                </Button>
              </div>
            </div>

            {/* Playlist list */}
            <div className="max-h-64 overflow-y-auto">
              {isLoading && (
                <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
              )}
              {!isLoading && playlists.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No playlists yet. Create one above!
                </div>
              )}
              {playlists.map((pl) => {
                const isAdded = added.has(pl.id) || pl.songs.some((s) => s.id === song.id);
                const isAdding = adding === pl.id;
                return (
                  <button
                    key={pl.id}
                    onClick={() => !isAdded && handleAdd(pl)}
                    disabled={isAdded || isAdding}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                      isAdded && "opacity-60",
                    )}
                  >
                    {pl.image || pl.songs[0]?.image ? (
                      <Image
                        src={pl.image || pl.songs[0]?.image || ""}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <Music2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{pl.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {pl.songCount} song{pl.songCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {isAdded ? (
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : isAdding ? (
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
