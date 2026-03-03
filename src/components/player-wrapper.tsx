"use client";
import { useEffect } from "react";
import useSWR from "swr";
import { useAudioTab } from "@/hooks/use-audio-tab";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useMediaSession } from "@/hooks/use-media-session";
import { usePlayback } from "@/hooks/use-playback";
import fetchMusic from "@/lib/apiFetcher";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updateMeta } from "@/store/player-slice";
import { type DownloadID } from "@/typings/download";
import { Player } from "./Player";
import type { AudioQuality } from "@/store/settings-slice";

export const PlayerWrapper = () => {
  const dispatch = useAppDispatch();
  const currentIndex = useAppSelector((s) => s.player.currentSong);
  const currentSongId = useAppSelector((s) => s.player.playlist[s.player.currentSong]?.id);
  const songs = useAppSelector((s) => s.player.playlist);
  const { saveNow } = usePlayback();
  const { isActiveTab } = useAudioTab();

  // Global keyboard shortcuts (Space, arrows, etc.)
  useKeyboardShortcuts();
  // OS-level media controls (lock screen, media keys)
  useMediaSession();

  // Audio quality setting → pick the right downloadUrl index
  // JioSaavn: [0]=12kbps, [1]=48kbps, [2]=96kbps, [3]=160kbps, [4]=320kbps
  const audioQuality = useAppSelector((s) => s.settings.audioQuality);
  const qualityIndex: Record<AudioQuality, number> = {
    low: 1,
    medium: 2,
    high: 3,
    extreme: 4,
  };

  // Save playback state on tab close / navigation
  useEffect(() => {
    const handler = () => {
      saveNow();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [saveNow]);

  const {
    data,
    error,
  }: {
    data: DownloadID;
    error: any;
  } = useSWR(currentSongId ?? null, fetchMusic, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    onSuccess: (_data: DownloadID) => {
      // noop
    },
    onError: (_err) => {
      // noop
    },
  });

  // hydrate queue metadata if missing
  useEffect(() => {
    if (!data || !songs.length) return;
    const current = songs[currentIndex];
    if (!current) return;

    const nextTitle = data?.data?.[0]?.name
      ? data.data[0].name.slice(0, 22).split("(")[0].replace("&#039;", "'")
      : current.title;
    const nextArtist = data?.data?.[0]?.primaryArtists || current.artist;
    const nextImage =
      data?.data?.[0]?.image?.[1]?.link || data?.data?.[0]?.image?.[0]?.link || current.image;
    const nextDuration = Number(data?.data?.[0]?.duration) || current.duration;

    const isSame =
      current.title === nextTitle &&
      current.artist === nextArtist &&
      current.image === nextImage &&
      current.duration === nextDuration;

    if (isSame) return;

    dispatch(
      updateMeta({
        index: currentIndex,
        meta: {
          title: nextTitle,
          artist: nextArtist,
          image: nextImage,
          duration: nextDuration,
        },
      }),
    );
  }, [data, songs, currentIndex, dispatch]);

  if (error) return null;
  if (!data) return null;

  // Only the tab that initiated playback should render the audio player
  if (!isActiveTab) return null;
  const imgURL = data?.data[0]?.image[1].link || data?.data[0]?.image[0].link || "";
  const title = data?.data[0]?.name.slice(0, 22).split("(")[0].replace("&#039;", "'") || "";
  const album = data?.data[0]?.album.name.split("(")[0].replace("&#039;", "'") || "";
  const urls = data?.data[0]?.downloadUrl ?? [];
  const qi = qualityIndex[audioQuality];
  const url = urls[qi]?.link || urls[3]?.link || urls[4]?.link || urls[2]?.link || urls[1]?.link;
  const downloadUrl = urls[4]?.link || urls[3]?.link || urls[2]?.link;

  return (
    <>
      <Player
        url={url}
        imageURL={imgURL}
        title={title}
        album={album}
        key={url}
        downloadURL={downloadUrl}
        trackId={songs[currentIndex]?.id}
        autoPlay={isActiveTab}
      />
    </>
  );
};
