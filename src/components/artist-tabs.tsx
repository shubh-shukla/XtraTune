"use client";

import { Loader2, Music2, Disc3 } from "lucide-react";
import { useState, useEffect } from "react";
import { AlbumCard } from "@/components/album-card";
import { AlbumPageCard } from "@/components/album-page-card";
import { cn } from "@/lib/utils";

type ArtistSongResult = {
  id: string;
  name: string;
  duration: string;
  primaryArtists: string;
  image: { link: string }[];
};

type ArtistAlbum = {
  id: string;
  name: string;
  year: string;
  type: string;
  songCount: string;
  language: string;
  url: string;
  image: { quality: string; link: string }[];
  artists: { name: string }[];
  releaseDate: string;
};

export function ArtistTabs({ artistId, songs }: { artistId: string; songs: ArtistSongResult[] }) {
  const [activeTab, setActiveTab] = useState<"songs" | "albums">("songs");
  const [albums, setAlbums] = useState<ArtistAlbum[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [albumsFetched, setAlbumsFetched] = useState(false);

  // Fetch albums when the Albums tab is first selected
  useEffect(() => {
    if (activeTab !== "albums" || albumsFetched) return;

    setLoadingAlbums(true);
    fetch(`/api/artist/albums?id=${artistId}&limit=50`)
      .then((r) => r.json())
      .then((data) => {
        setAlbums(data.albums ?? []);
        setAlbumsFetched(true);
      })
      .catch(() => {})
      .finally(() => setLoadingAlbums(false));
  }, [activeTab, artistId, albumsFetched]);

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex gap-2 my-4">
        <button
          type="button"
          onClick={() => setActiveTab("songs")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all",
            activeTab === "songs"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          <Music2 className="h-4 w-4" />
          Songs
          <span className="text-xs opacity-70">({songs.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("albums")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all",
            activeTab === "albums"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          <Disc3 className="h-4 w-4" />
          Albums
          {albumsFetched && <span className="text-xs opacity-70">({albums.length})</span>}
        </button>
      </div>

      {/* Songs tab */}
      {activeTab === "songs" && (
        <div className="flex flex-col gap-3 sm:gap-5">
          {songs.length > 0 ? (
            songs.map((song) => (
              <AlbumPageCard
                key={song.id + song.name}
                duration={song.duration}
                id={song.id}
                image={song.image}
                name={song.name}
                primaryArtists={song.primaryArtists}
              />
            ))
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Music2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No songs found</p>
            </div>
          )}
        </div>
      )}

      {/* Albums tab */}
      {activeTab === "albums" && (
        <div>
          {loadingAlbums ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading discography…</p>
            </div>
          ) : albums.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {albums.map((album) => (
                <AlbumCard
                  key={album.id}
                  id={album.id}
                  imageURL={album.image.map((img) => ({
                    link: img.link || img.quality || "/playlist-placeholder.webp",
                  }))}
                  title={album.name}
                  type={album.type || "album"}
                  url={album.url || ""}
                  songCount={album.songCount}
                  artists={album.artists}
                  width={200}
                  height={200}
                  className="w-full"
                  aspectRatio="square"
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Disc3 className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No albums found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
