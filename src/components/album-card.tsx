"use client";
import { Heart } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";
import { Card } from "./ui/card";
import type { LikeEntityType } from "@/store/likes-slice";
interface AlbumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageURL: {
    link: string;
  }[];
  title: string;
  height?: number;
  width?: number;
  url: string;
  id: string;
  type: string;
  songCount?: string;
  aspectRatio?: "portrait" | "square";
  language?: string;
  artists?: {
    name: string;
  }[];
}

export const AlbumCard = ({
  className,
  title,
  height,
  width,
  url: _url,
  id,
  type,
  songCount,
  imageURL,
  aspectRatio,
  language,
  artists,
}: AlbumCardProps) => {
  const router = useRouter();
  const likeType: LikeEntityType = type === "playlist" ? "playlist" : "album";
  const { isLiked: checkLiked, toggle: toggleFav, needsAuth } = useFavorites(likeType);
  const isLiked = checkLiked(id);
  let imgURL =
    imageURL[2].link || imageURL[1].link || imageURL[0].link || "/playlist-placeholder.webp";
  if (imgURL === "https://www.jiosaavn.com/_i/3.0/artist-default-music.png")
    imgURL = "/song-placeholder.webp";
  return (
    <Card
      onClick={() => {
        if (type === "playlist") router.push(`/album/${id}-playlist`);
        else if (type === "album") router.push(`/album/${id}-album`);
        else {
          router.push(`/album/artists/${id}`);
        }
      }}
      className={cn(
        "shrink-0 overflow-clip border-none rounded-none w-[250px] pb-2 active:scale-95 transition-transform cursor-pointer",
        className,
      )}
    >
      <div
        style={{
          height: `${height ?? 250}px`,
          width: `${width ?? 250}px`,
        }}
        className="overflow-hidden rounded-md relative"
      >
        <Image
          src={imgURL}
          alt={title}
          quality={50}
          width={width || 250}
          height={height || 250}
          className={cn(
            "h-full w-full object-cover transition-all hover:scale-105",
            aspectRatio === "portrait" ? "aspect-[3/4]" : "aspect-square",
          )}
        />
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
      <div className="space-y-1 text-sm">
        <h3 className="font-medium  mt-2 line-clamp-1">
          {title.split("(")[0].replace("&#039;", "'")}
        </h3>
        {songCount && (
          <p className="text-xs text-muted-foreground">
            {type} • {songCount} {Number(songCount) > 1 ? "Songs" : "Song"}
          </p>
        )}
        {language && (
          <p className="text-xs text-muted-foreground">{language || "Various Artists"}</p>
        )}
        {artists && (
          <p className="text-xs text-muted-foreground">{artists[0]?.name || "Various Artists"}</p>
        )}
      </div>
    </Card>
  );
};
