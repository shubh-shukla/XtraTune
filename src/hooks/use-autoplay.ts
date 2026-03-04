"use client";

import { useCallback, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { appendToPlaylist, setCurrentSong, type Playlist } from "@/store/player-slice";

/**
 * Hook that manages autoplay / up-next behavior.
 *
 * When the current song ends and autoplay is enabled:
 *  - If there are more songs in the queue → play next (handled in Player.tsx onend)
 *  - If this is the last song → fetch suggestions and append them
 */
export function useAutoplay() {
  const dispatch = useAppDispatch();
  const playlist = useAppSelector((s) => s.player.playlist);
  const currentSong = useAppSelector((s) => s.player.currentSong);
  const autoplay = useAppSelector((s) => s.player.autoplay);
  const fetchingRef = useRef(false);

  /**
   * Called when a song ends. Returns true if it handled the transition,
   * false if the caller should handle it (normal queue wrap-around).
   */
  const onSongEnd = useCallback(async () => {
    const isLastSong = currentSong >= playlist.length - 1;
    const currentId = playlist[currentSong]?.id;

    if (!isLastSong) {
      // Still songs in queue — just advance
      dispatch(setCurrentSong(currentSong + 1));
      return true;
    }

    // We're at the last song
    if (!autoplay) {
      // No autoplay — wrap to beginning
      dispatch(setCurrentSong(0));
      return true;
    }

    // Autoplay: fetch more songs
    if (!currentId || fetchingRef.current) {
      dispatch(setCurrentSong(0));
      return true;
    }

    fetchingRef.current = true;
    try {
      const res = await fetch(`/api/suggestions?id=${currentId}`);
      const data = await res.json();
      const songs: any[] = data.suggestions ?? data.songs ?? [];

      if (songs.length === 0) {
        // No suggestions available — wrap around
        dispatch(setCurrentSong(0));
        return true;
      }

      const newItems: Playlist[] = songs.map((s: any) => ({
        id: s.id,
        title: s.name?.split("(")[0]?.replace("&#039;", "'") ?? "Untitled",
        artist: s.primaryArtists ?? "",
        image: s.image?.[1]?.link ?? s.image?.[0]?.link ?? "/song-placeholder.webp",
        duration: Number(s.duration) || undefined,
      }));

      dispatch(appendToPlaylist(newItems));

      // Advance to the first new song
      // The playlist length before appending
      const nextIndex = playlist.length; // this is the index of the first appended song
      dispatch(setCurrentSong(nextIndex));

      return true;
    } catch {
      dispatch(setCurrentSong(0));
      return true;
    } finally {
      fetchingRef.current = false;
    }
  }, [dispatch, playlist, currentSong, autoplay]);

  return { onSongEnd, autoplay };
}
