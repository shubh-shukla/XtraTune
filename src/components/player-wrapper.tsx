"use client";
import { useEffect } from "react";
import { useSongStore } from "@/store/song-store";
import { Player } from "./Player";
import useSWR from "swr";
import { DownloadID } from "@/typings/download";
import fetchMusic from "@/lib/apiFetcher";
type Payload = {
  id: string;
  title: string;
  artist: string;
  url: string;
};
export const PlayerWrapper = () => {
  const currentIndex = useSongStore((state) => state.currentSong);
  const songs = useSongStore((state) => state.playlist);
  const updateMeta = useSongStore((state) => state.updateMeta);

  const {
    data,
    error,
  }: {
    data: DownloadID;
    error: any;
  } = useSWR(songs[currentIndex]?.id, fetchMusic, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    onSuccess: (data: DownloadID) => {
      console.log(data);
    },
    onError: (err) => {
      console.log(err);
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
      data?.data?.[0]?.image?.[1]?.link ||
      data?.data?.[0]?.image?.[0]?.link ||
      current.image;
    const nextDuration = Number(data?.data?.[0]?.duration) || current.duration;

    const isSame =
      current.title === nextTitle &&
      current.artist === nextArtist &&
      current.image === nextImage &&
      current.duration === nextDuration;

    if (isSame) return;

    updateMeta(currentIndex, {
      title: nextTitle,
      artist: nextArtist,
      image: nextImage,
      duration: nextDuration,
    });
  }, [data, songs, currentIndex, updateMeta]);

  if (error) return null;
  if (!data) return null;
  const imgURL = data?.data[0]?.image[1].link || data?.data[0]?.image[0].link ||
    "";
  const title =
    data?.data[0]?.name.slice(0, 22).split("(")[0].replace("&#039;", "'") || "";
  const album =
    data?.data[0]?.album.name.split("(")[0].replace("&#039;", "'") || "";
  const url = data?.data[0]?.downloadUrl[3]?.link ||
    data?.data[0]?.downloadUrl[4]?.link ||
    data?.data[0]?.downloadUrl[2]?.link ||
    data?.data[0]?.downloadUrl[1]?.link;
  const downloadUrl = data?.data[0]?.downloadUrl[5]?.link ||
    data?.data[0]?.downloadUrl[4].link || data?.data[0]?.downloadUrl[3]?.link;

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
      />
    </>
  );
};
