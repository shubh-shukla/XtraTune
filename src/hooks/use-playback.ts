"use client";

import { useCallback, useEffect, useRef } from "react";
import useSWR from "swr";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setPlaylist } from "@/store/player-slice";
import { store } from "@/store/store";
import { useAuth } from "./use-auth";
import { useCsrf, apiFetch } from "./use-csrf";

const fetcher = (url: string) =>
  fetch(url, { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null));

/**
 * usePlayback – resume playback feature.
 *
 * Logged-in users:
 *   - On mount, fetch last playback state from DB and hydrate the player store (paused).
 *   - Periodically save playback progress to the server (every 15 s).
 *
 * Guest users:
 *   - State is already persisted via redux-persist/localStorage. No extra work needed.
 */
export function usePlayback() {
  const { isAuthenticated, user: _user } = useAuth();
  const csrf = useCsrf();
  const dispatch = useAppDispatch();

  const playlist = useAppSelector((s) => s.player.playlist);
  const _currentSong = useAppSelector((s) => s.player.currentSong);

  const positionRef = useRef(0);
  const hasFetched = useRef(false);

  // Fetch saved playback state on mount (logged-in only)
  const { data: playbackData } = useSWR(isAuthenticated ? "/api/user/playback" : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  // Hydrate player store from server state (once)
  useEffect(() => {
    if (!isAuthenticated || !playbackData?.playback || hasFetched.current) return;
    hasFetched.current = true;

    const pb = playbackData.playback;
    // Only hydrate if local store is empty (respect user's current session)
    if (playlist.length === 0 && pb.playlist?.length) {
      dispatch(setPlaylist({ playlist: pb.playlist, index: pb.currentIndex ?? 0 }));
      positionRef.current = pb.position ?? 0;
    }
  }, [isAuthenticated, playbackData, playlist.length, dispatch]);

  // Periodic save (every 15 seconds while playing)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const { player } = store.getState();
      const song = player.playlist[player.currentSong];
      if (!song?.id) return;

      apiFetch(
        "/api/user/playback",
        {
          method: "PUT",
          body: JSON.stringify({
            songId: song.id,
            position: positionRef.current,
            playlist: player.playlist.slice(0, 50), // limit stored playlist size
            currentIndex: player.currentSong,
          }),
        },
        csrf,
      ).catch(() => {});
    }, 15_000);

    return () => clearInterval(interval);
  }, [isAuthenticated, csrf]);

  /** Call this from the player to keep positionRef up to date */
  const updatePosition = useCallback((pos: number) => {
    positionRef.current = pos;
  }, []);

  /** Force-save current state now (e.g. on beforeunload) */
  const saveNow = useCallback(async () => {
    if (!isAuthenticated) return;
    const { player } = store.getState();
    const song = player.playlist[player.currentSong];
    if (!song?.id) return;

    await apiFetch(
      "/api/user/playback",
      {
        method: "PUT",
        body: JSON.stringify({
          songId: song.id,
          position: positionRef.current,
          playlist: player.playlist.slice(0, 50),
          currentIndex: player.currentSong,
        }),
      },
      csrf,
    ).catch(() => {});
  }, [isAuthenticated, csrf]);

  return {
    updatePosition,
    saveNow,
    /** The position from the server (for initial hydration) */
    restoredPosition: playbackData?.playback?.position ?? 0,
  };
}
