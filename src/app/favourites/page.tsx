"use client";

import { Heart, Play, Music2, LogIn } from "lucide-react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HorizontalScroll } from "@/components/ui/horizontal-scroll";
import { Separator } from "@/components/ui/separator";
import { useAudioTab } from "@/hooks/use-audio-tab";
import { useAuth } from "@/hooks/use-auth";
import { useFavorites } from "@/hooks/use-favorites";
import fetchMusic from "@/lib/apiFetcher";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setPlaylist, setCurrentSong } from "@/store/player-slice";

/** Card matching the project's SongCard style */
function FavSongCard({ id, onRemove }: { id: string; onRemove: () => void }) {
  const { data, error } = useSWR(id, fetchMusic, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });
  const dispatch = useAppDispatch();
  const songs = useAppSelector((s) => s.player.playlist);
  const { claimAudio } = useAudioTab();

  const isLoading = !data && !error;

  const track = data?.data?.[0];
  const title = track?.name?.split("(")[0]?.replace("&#039;", "'") ?? "";
  const artist = track?.primaryArtists ?? "";
  const imgUrl =
    track?.image?.[2]?.link ??
    track?.image?.[1]?.link ??
    track?.image?.[0]?.link ??
    "/song-placeholder.webp";

  const handlePlay = () => {
    claimAudio();
    const existingIndex = songs.findIndex((s) => s.id === id);
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
            artist,
            image: imgUrl,
            duration: Number(track?.duration) || undefined,
          },
        ],
        index: songs.length,
      }),
    );
  };

  if (isLoading) {
    return (
      <Card className="overflow-clip border-none rounded-none w-[250px]">
        <div className="h-[250px] w-[250px] rounded-md bg-muted animate-pulse" />
        <div className="space-y-2 mt-4 px-1">
          <div className="h-3 w-32 rounded bg-muted animate-pulse" />
          <div className="h-2.5 w-24 rounded bg-muted animate-pulse" />
        </div>
      </Card>
    );
  }

  if (error || !track) return null;

  return (
    <Card
      onClick={handlePlay}
      className="overflow-clip border-none rounded-none w-[250px] cursor-pointer"
    >
      <div
        style={{ height: "250px", width: "250px" }}
        className="overflow-hidden rounded-md relative"
      >
        <Image
          src={imgUrl}
          alt={title}
          quality={50}
          width={250}
          height={250}
          className="h-auto w-auto object-cover transition-all hover:scale-105 aspect-square"
        />
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <Play className="h-5 w-5 fill-current" />
          </div>
        </div>
        {/* Unlike button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove from favourites"
          className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-rose-500/20 text-rose-200 shadow-sm backdrop-blur transition hover:scale-105"
        >
          <Heart className="h-4 w-4 fill-rose-500 text-rose-200" />
        </button>
      </div>
      <div className="space-y-1 text-sm">
        <h3 className="font-medium leading-none mt-4">{title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1">
          song • {artist.slice(0, 30)}
          {artist.length > 30 ? "..." : ""}
        </p>
      </div>
    </Card>
  );
}

export default function FavouritesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { ids: trackIds, toggle: toggleTrack, isLoading: favsLoading } = useFavorites("track");

  const loading = authLoading || (isAuthenticated && favsLoading);

  // Guest users see a sign-in prompt
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="px-4 py-6 pb-24">
        <div className="flex items-center gap-3 mb-1">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg">
            <Heart className="h-6 w-6 fill-current" />
          </div>
          <div>
            <h1 className="text-3xl font-cal font-semibold tracking-wide">Favourites</h1>
          </div>
        </div>
        <Separator className="my-5" />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Music2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold mb-1">Sign in to save favourites</h2>
          <p className="text-sm text-muted-foreground max-w-xs mb-6">
            Create an account or sign in to like songs and build your personal collection.
          </p>
          <Button
            variant="default"
            size="sm"
            className="rounded-full"
            onClick={() => signIn(undefined, { callbackUrl: "/favourites" })}
          >
            <LogIn className="h-4 w-4 mr-2" />
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg">
          <Heart className="h-6 w-6 fill-current" />
        </div>
        <div>
          <h1 className="text-3xl font-cal font-semibold tracking-wide">Favourites</h1>
          <p className="text-sm text-muted-foreground">
            {trackIds.length} {trackIds.length === 1 ? "song" : "songs"}
          </p>
        </div>
      </div>

      <Separator className="my-5" />

      {/* Loading state */}
      {loading && (
        <HorizontalScroll>
          <div className="flex gap-4 pr-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-clip border-none rounded-none w-[250px]">
                <div className="h-[250px] w-[250px] rounded-md bg-muted animate-pulse" />
                <div className="space-y-2 mt-4 px-1">
                  <div className="h-3 w-32 rounded bg-muted animate-pulse" />
                  <div className="h-2.5 w-24 rounded bg-muted animate-pulse" />
                </div>
              </Card>
            ))}
          </div>
        </HorizontalScroll>
      )}

      {/* Empty state */}
      {!loading && trackIds.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Music2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold mb-1">No favourites yet</h2>
          <p className="text-sm text-muted-foreground max-w-xs mb-6">
            Tap the heart icon on any song to add it here.
          </p>
        </div>
      )}

      {/* Cards grid – horizontal scroll matching rest of app */}
      {!loading && trackIds.length > 0 && (
        <HorizontalScroll>
          <div className="flex gap-4 pr-8">
            {trackIds.map((id) => (
              <FavSongCard key={id} id={id} onRemove={() => toggleTrack(id)} />
            ))}
          </div>
        </HorizontalScroll>
      )}
    </div>
  );
}
