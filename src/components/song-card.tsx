"use client";
import { Heart, Play } from "lucide-react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useAudioTab } from "@/hooks/use-audio-tab";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setCurrentSong, setPlaylist } from "@/store/player-slice";
import { Card } from "./ui/card";
interface SongProps extends React.HTMLAttributes<HTMLDivElement> {
  imageURL: {
    link: string;
  }[];
  title: string;
  height?: number;
  width?: number;
  url: string;
  id: string;
  artists?:
    | {
        name: string;
      }[]
    | string;
  type: string;
  singer?: string;
  aspectRatio?: "portrait" | "square";
}
export const SongCard = ({
  title,
  imageURL,
  className,
  height,
  width,
  url: _url,
  id,
  artists,
  type,
  aspectRatio,
  singer,
}: SongProps) => {
  const imgURL =
    imageURL[2].link || imageURL[1].link || imageURL[0].link || "https://via.placeholder.com/150";
  const dispatch = useAppDispatch();
  const songs = useAppSelector((s) => s.player.playlist);
  const _currentIndex = useAppSelector((s) => s.player.currentSong);
  const { isLiked: checkLiked, toggle: toggleFav, needsAuth } = useFavorites("track");
  const isLiked = checkLiked(id);
  const { claimAudio } = useAudioTab();

  const normalizeArtists = (value: SongProps["artists"]): { name: string }[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      return value
        .split(",")
        .map((name) => ({ name: name.trim() }))
        .filter((a) => a.name);
    }
    return [];
  };
  return (
    <Card
      onClick={() => {
        claimAudio();
        const existingIndex = songs.findIndex((song) => song.id === id);
        if (existingIndex !== -1) {
          dispatch(setCurrentSong(existingIndex));
          return;
        }
        dispatch(
          setPlaylist({
            playlist: [
              ...songs,
              {
                id,
                title,
                artist:
                  normalizeArtists(artists)
                    .map((a) => a.name)
                    .join(", ") || undefined,
                image: imgURL,
              },
            ],
            index: songs.length,
          }),
        );
      }}
      className={cn(
        "shrink-0 overflow-clip border-none rounded-none w-[250px] pb-2 cursor-pointer",
        className,
      )}
    >
      <div
        style={{
          height: `${height ?? 250}px`,
          width: `${width ?? 250}px`,
        }}
        className="overflow-hidden rounded-md relative group/img"
      >
        <Image
          src={imgURL}
          alt={title}
          quality={50}
          width={width || 250}
          height={height || 250}
          className={cn(
            "h-auto w-auto object-cover transition-all group-hover/img:scale-105",
            aspectRatio === "portrait" ? "aspect-[3/4]" : "aspect-square",
          )}
        />
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/30">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg cursor-pointer">
            <Play className="h-5 w-5 fill-current" />
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (needsAuth) {
              signIn(undefined, { callbackUrl: window.location.pathname });
              return;
            }
            toggleFav(id);
          }}
          aria-label={isLiked ? "Unlike" : "Like"}
          className={cn(
            "absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white shadow-sm backdrop-blur transition hover:scale-105",
            isLiked && "bg-rose-500/20 text-rose-200",
          )}
        >
          <Heart className={cn("h-4 w-4", isLiked && "fill-rose-500 text-rose-200")} />
        </button>
      </div>
      <div className="space-y-1 text-sm ">
        {/* <a href={url}> */}
        <h3 className="font-medium leading-none mt-4">
          {title.split("(")[0].replace("&#039;", "'")}
        </h3>
        {/* </a> */}
        <p className="text-xs text-muted-foreground">
          {type} •{" "}
          {(() => {
            const list = normalizeArtists(artists);
            if (list.length === 0) return "";
            const full = list.map((artist) => artist.name).join(", ");
            return full.length > 22 ? full.slice(0, 22) + "..." : full;
          })()}
        </p>
        {singer && <p className=" line-clamp-1 text-xs text-muted-foreground">{singer}</p>}
      </div>
    </Card>
  );
};
