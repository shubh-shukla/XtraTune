"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "./use-auth";
import { useCsrf, apiFetch } from "./use-csrf";

interface Song {
  id?: string;
  title: string;
  artist: string;
  language?: string;
}

const THRESHOLD_SECONDS = 30;

export function useListeningHistory(song: Song | null, currentSeconds: number) {
  const { isAuthenticated } = useAuth();
  const csrf = useCsrf();
  const loggedRef = useRef<string | null>(null);

  useEffect(() => {
    if (loggedRef.current && loggedRef.current !== song?.id) {
      loggedRef.current = null;
    }
  }, [song?.id]);

  useEffect(() => {
    if (!isAuthenticated || !song?.id) return;
    if (loggedRef.current === song.id) return;
    if (currentSeconds < THRESHOLD_SECONDS) return;

    loggedRef.current = song.id;
    apiFetch(
      "/api/user/listening-history",
      {
        method: "POST",
        body: JSON.stringify({
          songId: song.id,
          title: song.title,
          artist: song.artist,
          language: song.language ?? "",
        }),
      },
      csrf,
    ).catch(() => {
      loggedRef.current = null;
    });
  }, [isAuthenticated, song?.id, song?.title, song?.artist, song?.language, currentSeconds, csrf]);
}
