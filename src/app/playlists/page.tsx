"use client";

import { Plus, Music2, Trash2, Pencil, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUserPlaylists, type UserPlaylist } from "@/hooks/use-user-playlists";
import { useAppDispatch } from "@/store/hooks";
import { setPlaylist } from "@/store/player-slice";

export default function PlaylistsPage() {
  const { status } = useSession();
  const { playlists, isLoading, createPlaylist, deletePlaylist, updatePlaylist } =
    useUserPlaylists();
  const dispatch = useAppDispatch();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Music2 className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-cal">My Playlists</h1>
        <p className="text-muted-foreground">Sign in to create and manage your playlists</p>
        <Button onClick={() => signIn(undefined, { callbackUrl: "/playlists" })} className="mt-2">
          Sign In
        </Button>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    await createPlaylist(newName.trim());
    setNewName("");
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await deletePlaylist(id);
    setDeleting(null);
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }
    await updatePlaylist(id, { name: editName.trim() });
    setEditingId(null);
  };

  const handlePlayAll = (playlist: UserPlaylist) => {
    if (!playlist.songs.length) return;
    dispatch(
      setPlaylist({
        playlist: playlist.songs.map((s) => ({
          id: s.id,
          title: s.title,
          artist: s.artist,
          image: s.image,
          duration: s.duration,
        })),
        index: 0,
      }),
    );
  };

  return (
    <div className="px-2 sm:px-4 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-cal">My Playlists</h1>
      </div>

      {/* Create new playlist */}
      <div className="flex gap-2 mb-8">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="New playlist name..."
          className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/50"
          maxLength={100}
        />
        <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="gap-1.5">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create</span>
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && playlists.length === 0 && (
        <div className="text-center py-16">
          <Music2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No playlists yet. Create your first one above!</p>
        </div>
      )}

      {/* Playlist grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {playlists.map((pl) => (
          <div
            key={pl.id}
            className="group relative bg-muted/50 hover:bg-muted rounded-xl p-4 transition-colors"
          >
            <div className="flex items-start gap-4">
              {/* Artwork */}
              <Link
                href={`/playlists/${pl.id}`}
                className="shrink-0 relative h-20 w-20 rounded-lg overflow-hidden bg-muted"
              >
                {pl.songs[0]?.image ? (
                  <Image
                    src={pl.songs[0].image}
                    alt={pl.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Music2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                {/* Play overlay */}
                {pl.songs.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handlePlayAll(pl);
                    }}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Play className="h-8 w-8 text-white fill-current" />
                  </button>
                )}
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {editingId === pl.id ? (
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(pl.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onBlur={() => handleRename(pl.id)}
                    className="w-full rounded bg-background px-2 py-1 text-sm font-medium outline-none ring-2 ring-primary/50"
                  />
                ) : (
                  <Link href={`/playlists/${pl.id}`}>
                    <h3 className="font-medium truncate hover:underline">{pl.name}</h3>
                  </Link>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  {pl.songCount} song{pl.songCount !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setEditingId(pl.id);
                    setEditName(pl.name);
                  }}
                  title="Rename"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(pl.id)}
                  disabled={deleting === pl.id}
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
