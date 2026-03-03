"use client";

import { useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setCurrentSong } from "@/store/player-slice";

/**
 * Registers a MediaSession so that OS-level media controls (lock screen,
 * notification shade, media keys on keyboards, Bluetooth headsets, AirPods)
 * can control playback.
 *
 * Must be rendered inside the PlayerWrapper (needs access to current song
 * metadata and the Redux store).
 */
export function useMediaSession() {
  const dispatch = useAppDispatch();
  const playlist = useAppSelector((s) => s.player.playlist);
  const currentIdx = useAppSelector((s) => s.player.currentSong);
  const song = playlist[currentIdx];

  // Use a ref for dynamic callbacks so we don't re-register every render
  const stateRef = useRef({ playlist, currentIdx });
  stateRef.current = { playlist, currentIdx };

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    // ── Metadata ──
    if (song) {
      const artwork: MediaImage[] = song.image
        ? [
            { src: song.image, sizes: "96x96", type: "image/jpeg" },
            { src: song.image, sizes: "256x256", type: "image/jpeg" },
            { src: song.image, sizes: "512x512", type: "image/jpeg" },
          ]
        : [];

      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title ?? "Unknown",
        artist: song.artist ?? "",
        album: "",
        artwork,
      });
    }
  }, [song]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    // ── Action handlers ──
    const clickPlayPause = () => {
      const btn = document.querySelector<HTMLButtonElement>("[data-player-playpause]");
      btn?.click();
    };

    navigator.mediaSession.setActionHandler("play", clickPlayPause);
    navigator.mediaSession.setActionHandler("pause", clickPlayPause);

    navigator.mediaSession.setActionHandler("previoustrack", () => {
      const { playlist: pl, currentIdx: ci } = stateRef.current;
      if (!pl.length) return;
      dispatch(setCurrentSong(ci <= 0 ? pl.length - 1 : ci - 1));
    });

    navigator.mediaSession.setActionHandler("nexttrack", () => {
      const { playlist: pl, currentIdx: ci } = stateRef.current;
      if (!pl.length) return;
      dispatch(setCurrentSong(ci >= pl.length - 1 ? 0 : ci + 1));
    });

    // Seek (if browser supports it)
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      const audio = document.querySelector("audio");
      if (audio && details.seekTime != null) {
        audio.currentTime = details.seekTime;
      }
    });

    return () => {
      // Cleanup
      try {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("previoustrack", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
        navigator.mediaSession.setActionHandler("seekto", null);
      } catch {
        // Safari may not support removing handlers
      }
    };
  }, [dispatch]);
}
