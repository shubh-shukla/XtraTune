import { Heart, Bookmark, ListEnd, ListPlus } from "lucide-react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import useSound from "use-sound";
import { useAutoplay } from "@/hooks/use-autoplay";
import { useFavorites } from "@/hooks/use-favorites";
import { usePlayback } from "@/hooks/use-playback";
import { cn } from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { toggleSave as toggleSaveAction } from "@/store/likes-slice";
import {
  setCurrentSong as setCurrentSongAction,
  setVolume as setVolumeAction,
  toggleAutoplay,
} from "@/store/player-slice";
import { AddToPlaylistModal } from "./add-to-playlist-modal";
import { Icons } from "./icons";
import { LyricsPanel } from "./lyrics-panel";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Skeleton } from "./ui/skeleton";
import { Slider } from "./ui/slider";
export const Player = ({
  url,
  album,
  imageURL,
  title,
  downloadURL,
  trackId,
  autoPlay = false,
}: {
  url: string;
  imageURL: string;
  title: string;
  album: string;
  downloadURL: string;
  trackId?: string;
  autoPlay?: boolean;
}) => {
  const dispatch = useAppDispatch();
  const currentSong = useAppSelector((s) => s.player.currentSong);
  const playlist = useAppSelector((s) => s.player.playlist);
  const volume = useAppSelector((s) => s.player.volume);
  const saves = useAppSelector((s) => s.likes.saves);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [barPostion, setBarPosition] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [link] = useState(url);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const safeId = trackId || "";
  const isSaved = safeId ? saves.track.includes(safeId) : false;

  // ── Synced favorites (server-only, requires auth) ──
  const { isLiked: checkLiked, toggle: toggleFav, needsAuth } = useFavorites("track");
  const isLiked = safeId ? checkLiked(safeId) : false;

  // ── Playback resume hook ──
  const { updatePosition, saveNow } = usePlayback();

  // ── Autoplay hook ──
  const { onSongEnd, autoplay } = useAutoplay();
  const onSongEndRef = useRef(onSongEnd);
  onSongEndRef.current = onSongEnd;

  // Stable refs so the main play-effect doesn't re-run when callbacks change
  const updatePositionRef = useRef(updatePosition);
  updatePositionRef.current = updatePosition;
  const saveNowRef = useRef(saveNow);
  saveNowRef.current = saveNow;

  const [play, { pause, duration, sound }] = useSound(link, {
    onload: () => {
      setIsLoading(false);
    },
    onend: () => {
      setIsPlaying(false);
      if (!playlist.length) return;
      // Delegate to autoplay hook — it handles suggestions/queue
      onSongEndRef.current();
    },
    volume: volume,
  });
  const actualVolume = useRef(volume * 100);
  const playingButton = () => {
    if (isPlaying) {
      pause();
      setIsPlaying(false);
    } else {
      play();
      setIsPlaying(true);
    }
  };
  const toggleMute = () => {
    if (volume === 0) {
      dispatch(setVolumeAction(actualVolume.current / 100));
    } else {
      dispatch(setVolumeAction(0));
    }
  };
  // Track whether this is the first mount (page reload) vs a user-initiated song change

  useEffect(() => {
    if (isLoading || !sound) return;

    // Only auto-play when explicitly requested (user clicked a song)
    if (autoPlay) {
      sound.play();
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }

    const timer = setInterval(() => {
      const position: number = sound?.seek();
      setBarPosition(position);
      updatePositionRef.current(position);
    }, 1000);
    return () => {
      clearInterval(timer);
      saveNowRef.current();
      sound?.stop();
    };
  }, [sound, isLoading, autoPlay]);

  useEffect(() => {
    setBarPosition(0);
  }, [url]);

  return (
    <Card
      key={url}
      className="fixed bottom-0 pb-0 z-50 rounded-none bg-background/90 dark:bg-background/80 backdrop-blur-lg border-t border-border shadow-[0_-1px_4px_rgba(0,0,0,0.06)] dark:shadow-none h-[70px] left-0 right-0"
    >
      <div className="relative w-full h-full grid grid-cols-3 justify-between ">
        {/* left side */}
        <div className="flex gap-x-4 max-w-xs items-center">
          {isLoading ? (
            <Skeleton className=" h-[70px] w-[70px] " />
          ) : (
            <Image src={imageURL} width={70} height={70} className="w-[70px] h-[70px]" alt="song" />
          )}

          <div className=" hidden md:block md:py-4 ">
            {isLoading ? (
              <>
                <Skeleton className="h-4 w-[150px] mb-2 " />
                <Skeleton className="h-4 w-[100px] " />
              </>
            ) : (
              <>
                <p className="text-sm font-cal tracking-wide">{title}</p>
                <p className="text-xs">{album}</p>
              </>
            )}
          </div>
        </div>
        {/* middle controls */}
        <div className="flex flex-1  items-center justify-center gap-x-2 md:gap-x-4 ">
          <Button
            onClick={
              currentSong === 0
                ? () => dispatch(setCurrentSongAction(playlist.length - 1))
                : () => dispatch(setCurrentSongAction(currentSong - 1))
            }
            className="active:scale-90 select-none transition-transform"
            variant="secondary"
            size="icon"
          >
            <Icons.prev className="h-4 w-4" />
          </Button>
          <Button
            disabled={isLoading}
            onClick={playingButton}
            data-player-playpause=""
            className="active:scale-90 select-none relative transition-transform"
            variant="default"
            size="icon"
          >
            {isLoading ? (
              <Icons.loader className={cn("h-4 w-4 animate-spin absolute transition-all ")} />
            ) : (
              <>
                <Icons.play
                  className={cn("h-4 w-4 transition-all", isPlaying && " scale-0 -rotate-90")}
                />

                <Icons.pause
                  className={cn(
                    "h-4 w-4 absolute transition-all ",
                    !isPlaying && " rotate-90 scale-0 ",
                  )}
                />
              </>
            )}
          </Button>
          <Button
            onClick={
              currentSong === playlist.length - 1
                ? () => dispatch(setCurrentSongAction(0))
                : () => dispatch(setCurrentSongAction(currentSong + 1))
            }
            className="active:scale-90  transition-transform"
            variant="secondary"
            size="icon"
          >
            <Icons.next className="h-4 w-4" />
          </Button>
        </div>
        {/* right side */}
        <div className="flex justify-end items-center md:gap-x-2 pr-4">
          <Button
            onClick={() => {
              if (!safeId) return;
              if (needsAuth) {
                signIn(undefined, { callbackUrl: window.location.pathname });
                return;
              }
              toggleFav(safeId);
            }}
            disabled={!safeId}
            className={cn(
              "active:scale-90 hidden sm:inline-flex transition-transform",
              isLiked && "text-rose-400",
            )}
            variant="ghost"
            size="icon"
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-rose-500 text-rose-400")} />
          </Button>
          <Button
            disabled={isLoading || downloading}
            onClick={() => {
              setDownloading(true);
              fetch(downloadURL)
                .then((res) => res.blob())
                .then((blob) => {
                  const blobUrl = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = blobUrl;
                  a.download = title;
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(blobUrl);
                })
                .finally(() => setDownloading(false));
            }}
            className="active:scale-90 transition-transform"
            variant="ghost"
            size="icon"
          >
            {downloading ? (
              <Icons.loader className={cn("h-4 w-4 transition-all animate-spin ")} />
            ) : (
              <Icons.download className={cn(" scale-100  h-4 w-4 ")} />
            )}
          </Button>
          <LyricsPanel songId={safeId} songTitle={title} artist={album} />
          <Button
            className=" hidden sm:flex active:scale-90 transition-transform"
            variant="ghost"
            size="icon"
            onClick={() => dispatch(toggleSaveAction({ entityType: "track", id: trackId || "" }))}
            disabled={!trackId}
            aria-label={isSaved ? "Unsave" : "Save"}
          >
            <Bookmark className={cn("h-4 w-4", isSaved && "fill-primary text-primary")} />
          </Button>
          {/* Add to Playlist */}
          <Button
            className="hidden sm:grid h-9 w-9 place-items-center active:scale-90 transition-transform"
            variant="ghost"
            size="icon"
            onClick={() => setShowAddToPlaylist(true)}
            disabled={!trackId}
            aria-label="Add to playlist"
            title="Add to playlist"
          >
            <ListPlus className="h-4 w-4" />
          </Button>
          {/* Autoplay toggle */}
          <Button
            className={cn(
              "hidden sm:grid h-9 w-9 place-items-center active:scale-90 transition-transform",
              autoplay && "text-primary",
            )}
            variant="ghost"
            size="icon"
            onClick={() => dispatch(toggleAutoplay())}
            aria-label={autoplay ? "Disable autoplay" : "Enable autoplay"}
            title={autoplay ? "Autoplay on" : "Autoplay off"}
          >
            <ListEnd className={cn("h-4 w-4", autoplay && "text-primary")} />
          </Button>
          <div className="hidden md:flex items-center gap-x-2">
            <Button
              disabled={isLoading}
              onClick={toggleMute}
              className="active:scale-90 relative transition-transform"
              variant="ghost"
              size="icon"
            >
              {
                <Icons.mute
                  className={cn("h-5 transition-transform w-5", volume !== 0 && "scale-0")}
                />
              }
              {
                <Icons.lowVolume
                  className={cn(
                    "h-5 absolute transition-transform w-5",
                    volume * 100 >= 50 || (volume * 100 === 0 && "scale-0"),
                  )}
                />
              }
              {
                <Icons.highVolume
                  className={cn(
                    "h-5 absolute transition-transform w-5",
                    volume * 100 < 50 || volume === 0 ? "scale-0" : null,
                  )}
                />
              }
            </Button>
            <Slider
              orientation="horizontal"
              disabled={isLoading}
              defaultValue={[volume * 100]}
              max={100}
              step={1}
              onValueChange={(value) => {
                dispatch(setVolumeAction(value[0] / 100));
                actualVolume.current = value[0];
              }}
              className={cn("w-[100px] h-1 ")}
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                disabled={isLoading}
                className=" md:hidden active:scale-90 relative transition-transform"
                variant="ghost"
                size="icon"
              >
                {
                  <Icons.mute
                    className={cn("h-5 transition-transform w-5", volume !== 0 && "scale-0")}
                  />
                }
                {
                  <Icons.lowVolume
                    className={cn(
                      "h-5 absolute transition-transform w-5",
                      volume * 100 >= 50 || (volume * 100 === 0 && "scale-0"),
                    )}
                  />
                }
                {
                  <Icons.highVolume
                    className={cn(
                      "h-5 absolute transition-transform w-5",
                      volume * 100 < 50 || volume === 0 ? "scale-0" : null,
                    )}
                  />
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-max px-3 border">
              <Slider
                orientation="vertical"
                disabled={isLoading}
                defaultValue={[volume * 100]}
                max={100}
                step={1}
                onValueChange={(value) => {
                  dispatch(setVolumeAction(value[0] / 100));
                  actualVolume.current = value[0];
                }}
                className={cn("h-[100px] w-1 ")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Add to playlist modal */}
        {showAddToPlaylist && safeId && (
          <AddToPlaylistModal
            song={{
              id: safeId,
              title,
              artist: album,
              image: imageURL,
              duration: duration ? Math.round(duration / 1000) : 0,
            }}
            open={showAddToPlaylist}
            onClose={() => setShowAddToPlaylist(false)}
          />
        )}

        {/* player bar */}
        <div className="absolute top-0  -translate-y-[98%]  pt-5 pb-0 w-full ">
          <Slider
            orientation="horizontal"
            value={[barPostion]}
            defaultValue={[0]}
            step={1}
            max={(duration || 0) / 1000}
            onValueChange={(e) => {
              sound.seek(e[0]);
            }}
            className="w-full h-1.5 rounded-none cursor-pointer  player"
          />
        </div>
      </div>
    </Card>
  );
};
