"use client";

import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCurrentSong, setVolume, toggleAutoplay } from "@/store/player-slice";

/**
 * Global keyboard shortcuts for the music player.
 *
 * Space / K       – play / pause
 * ArrowRight / L  – next track
 * ArrowLeft / J   – previous track
 * ArrowUp         – volume up (+10%)
 * ArrowDown       – volume down (-10%)
 * M               – mute / unmute
 * A               – toggle autoplay
 *
 * All shortcuts are ignored when the user is typing in an input/textarea.
 */
export function useKeyboardShortcuts() {
  const dispatch = useAppDispatch();
  const playlist = useAppSelector((s) => s.player.playlist);
  const currentSong = useAppSelector((s) => s.player.currentSong);
  const volume = useAppSelector((s) => s.player.volume);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      // Skip if user is typing
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      switch (e.key) {
        case " ":
        case "k":
        case "K": {
          e.preventDefault();
          // Click the play/pause button in the player
          const btn = document.querySelector<HTMLButtonElement>("[data-player-playpause]");
          btn?.click();
          break;
        }

        case "ArrowRight":
        case "l":
        case "L": {
          if (!playlist.length) return;
          e.preventDefault();
          const next = currentSong >= playlist.length - 1 ? 0 : currentSong + 1;
          dispatch(setCurrentSong(next));
          break;
        }

        case "ArrowLeft":
        case "j":
        case "J": {
          if (!playlist.length) return;
          e.preventDefault();
          const prev = currentSong <= 0 ? playlist.length - 1 : currentSong - 1;
          dispatch(setCurrentSong(prev));
          break;
        }

        case "ArrowUp": {
          e.preventDefault();
          dispatch(setVolume(Math.min(1, volume + 0.1)));
          break;
        }

        case "ArrowDown": {
          e.preventDefault();
          dispatch(setVolume(Math.max(0, volume - 0.1)));
          break;
        }

        case "m":
        case "M": {
          e.preventDefault();
          dispatch(setVolume(volume === 0 ? 0.5 : 0));
          break;
        }

        case "a":
        case "A": {
          e.preventDefault();
          dispatch(toggleAutoplay());
          break;
        }
      }
    },
    [dispatch, playlist, currentSong, volume],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);
}
