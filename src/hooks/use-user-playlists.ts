"use client";

import { useSession } from "next-auth/react";
import { useCallback } from "react";
import useSWR from "swr";
import { apiFetch, useCsrf } from "./use-csrf";

export interface UserPlaylistSong {
  id: string;
  title: string;
  artist: string;
  image: string;
  duration: number;
  addedAt: string;
}

export interface UserPlaylist {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  songCount: number;
  songs: UserPlaylistSong[];
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) =>
  fetch(url, { credentials: "same-origin" }).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

/**
 * Hook for managing user's custom playlists.
 * Returns CRUD operations + SWR data.
 */
export function useUserPlaylists() {
  const { status } = useSession();
  const csrf = useCsrf();
  const isAuth = status === "authenticated";

  const { data, error, isLoading, mutate } = useSWR<{ playlists: UserPlaylist[] }>(
    isAuth ? "/api/playlists" : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10_000 },
  );

  const playlists = data?.playlists ?? [];

  // ── Create ──
  const createPlaylist = useCallback(
    async (name: string, description?: string): Promise<UserPlaylist | null> => {
      try {
        const res = await apiFetch(
          "/api/playlists",
          { method: "POST", body: JSON.stringify({ name, description }) },
          csrf,
        );
        if (!res.ok) return null;
        const created = await res.json();
        mutate(); // revalidate list
        return created;
      } catch {
        return null;
      }
    },
    [csrf, mutate],
  );

  // ── Delete ──
  const deletePlaylist = useCallback(
    async (playlistId: string): Promise<boolean> => {
      try {
        const res = await apiFetch(`/api/playlists/${playlistId}`, { method: "DELETE" }, csrf);
        if (!res.ok) return false;
        mutate();
        return true;
      } catch {
        return false;
      }
    },
    [csrf, mutate],
  );

  // ── Rename / update description ──
  const updatePlaylist = useCallback(
    async (
      playlistId: string,
      updates: { name?: string; description?: string },
    ): Promise<boolean> => {
      try {
        const res = await apiFetch(
          `/api/playlists/${playlistId}`,
          { method: "PATCH", body: JSON.stringify(updates) },
          csrf,
        );
        if (!res.ok) return false;
        mutate();
        return true;
      } catch {
        return false;
      }
    },
    [csrf, mutate],
  );

  // ── Add song ──
  const addSong = useCallback(
    async (
      playlistId: string,
      song: { id: string; title: string; artist: string; image: string; duration: number },
    ): Promise<boolean> => {
      try {
        const res = await apiFetch(
          `/api/playlists/${playlistId}/songs`,
          { method: "POST", body: JSON.stringify(song) },
          csrf,
        );
        if (!res.ok) return false;
        mutate();
        return true;
      } catch {
        return false;
      }
    },
    [csrf, mutate],
  );

  // ── Remove song ──
  const removeSong = useCallback(
    async (playlistId: string, songId: string): Promise<boolean> => {
      try {
        const res = await apiFetch(
          `/api/playlists/${playlistId}/songs?songId=${songId}`,
          { method: "DELETE" },
          csrf,
        );
        if (!res.ok) return false;
        mutate();
        return true;
      } catch {
        return false;
      }
    },
    [csrf, mutate],
  );

  // ── Reorder (pass full songs array in new order) ──
  const reorderSongs = useCallback(
    async (playlistId: string, songs: UserPlaylistSong[]): Promise<boolean> => {
      try {
        const res = await apiFetch(
          `/api/playlists/${playlistId}`,
          { method: "PATCH", body: JSON.stringify({ songs }) },
          csrf,
        );
        if (!res.ok) return false;
        mutate();
        return true;
      } catch {
        return false;
      }
    },
    [csrf, mutate],
  );

  return {
    playlists,
    isLoading,
    error,
    isAuth,
    createPlaylist,
    deletePlaylist,
    updatePlaylist,
    addSong,
    removeSong,
    reorderSongs,
    mutate,
  };
}
