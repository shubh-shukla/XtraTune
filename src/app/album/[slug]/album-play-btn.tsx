"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useAudioTab } from "@/hooks/use-audio-tab";
import { useAppDispatch } from "@/store/hooks";
import { setPlaylist, setCurrentSong } from "@/store/player-slice";
import { type Song } from "@/typings/albumdata";
import { type Song as Playlist } from "@/typings/playlist";

export const AlbumPlayBtn = ({ album }: { album: Song[] | Playlist[] }) => {
  const dispatch = useAppDispatch();
  const { claimAudio } = useAudioTab();
  const startPlaylist = () => {
    claimAudio();
    dispatch(
      setPlaylist({
        playlist: album.map((song) => ({
          id: song.id,
          title: song.name.split("(")[0].replace("&#039;", "'"),
          artist: song.primaryArtists,
          image: song.image?.[1]?.link || song.image?.[0]?.link,
          duration: Number(song.duration),
        })),
        index: 0,
      }),
    );
    dispatch(setCurrentSong(0));
  };
  return (
    <div className="flex gap-2 items-center">
      <Button
        onClick={startPlaylist}
        variant="default"
        className="active:scale-90 transition-transform"
        size={"icon"}
      >
        <Icons.play className="" />
      </Button>
      <Button variant="secondary">Share</Button>
    </div>
  );
};
