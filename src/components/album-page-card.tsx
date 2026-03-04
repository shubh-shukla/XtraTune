"use client";
import Image from "next/image";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setCurrentSong, setPlaylist } from "@/store/player-slice";
import { Icons } from "./icons";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
interface AlbumPageCardProps {
  name: string;
  id: string;
  primaryArtists: string;
  duration: string;
  image: {
    link: string;
  }[];
}
export const AlbumPageCard = ({
  name,
  id,
  primaryArtists,
  duration,
  image,
}: AlbumPageCardProps) => {
  const dispatch = useAppDispatch();
  const songs = useAppSelector((s) => s.player.playlist);
  const _currentIndex = useAppSelector((s) => s.player.currentSong);
  return (
    <Card className="border pb-0 overflow-hidden flex items-center gap-x-2 sm:gap-x-5 pr-4">
      <Image
        src={image[1].link}
        width={136}
        height={136}
        className="rounded-l-lg w-20 h-20 sm:h-[136px] sm:w-[136px] aspect-square"
        alt={name}
      />

      <div className="  flex-1  ">
        <h3 className="font-cal text-base sm:text-2xl lg:text-xl xl:text-2xl line-clamp-2">
          {name.split("(")[0].slice(0, 22).replace("&#039;", "'")}
        </h3>
        <p className="text-muted-foreground text-xs sm:text-base line-clamp-1">
          {primaryArtists.slice(0, 30)}
        </p>
        <div className=" hidden sm:flex justify-between items-center">
          <p className="text-muted-foreground">
            {Math.floor(Number(duration) / 60)}:{String(Number(duration) % 60).padStart(2, "0")} min
          </p>
          <Button
            onClick={() => {
              const idx = songs.findIndex((song) => song.id === id);
              if (idx !== -1) {
                dispatch(setCurrentSong(idx));
                return;
              }
              dispatch(setPlaylist({ playlist: [...songs, { id }], index: songs.length }));
            }}
            variant="secondary"
            className=" active:scale-90 transition-transform ml-auto"
            size="icon"
          >
            <Icons.play className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Button
        onClick={() => {
          const idx = songs.findIndex((song) => song.id === id);
          if (idx !== -1) {
            dispatch(setCurrentSong(idx));
            return;
          }
          dispatch(setPlaylist({ playlist: [...songs, { id }], index: songs.length }));
        }}
        variant="secondary"
        className=" active:scale-90 transition-transform sm:hidden ml-auto"
        size="icon"
      >
        <Icons.play className="w-4 h-4" />
      </Button>
    </Card>
  );
};
