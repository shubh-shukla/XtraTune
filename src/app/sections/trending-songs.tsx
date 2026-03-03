import { AlbumCard } from "@/components/album-card";
import { SongCard } from "@/components/song-card";
import { HorizontalScroll } from "@/components/ui/horizontal-scroll";
import { Separator } from "@/components/ui/separator";
import { type Album3 as Album, type Song } from "@/typings/homepage";

export const TrendingSongs = ({ songs, albums }: { songs: Song[]; albums: Album[] }) => {
  return (
    <>
      {/* ── Trending Songs ─────────────────────────── */}
      {songs.length > 0 && (
        <section className="space-y-4 border-none">
          <div className="mt-6 space-y-1">
            <h2 className="text-3xl font-cal font-semibold tracking-wide">Trending Songs</h2>
          </div>
          <Separator className="my-4" />
          <HorizontalScroll>
            <div className="flex gap-4 pr-8">
              {songs.map((item) => (
                <SongCard
                  key={item.id}
                  id={item.id}
                  imageURL={item.image}
                  title={item.name}
                  type={item.type}
                  url={item.url}
                  artists={item.primaryArtists}
                />
              ))}
            </div>
          </HorizontalScroll>
        </section>
      )}

      {/* ── Trending Albums ────────────────────────── */}
      {albums.length > 0 && (
        <section className="space-y-4 border-none">
          <div className="mt-6 space-y-1">
            <h2 className="text-3xl font-cal font-semibold tracking-wide">Trending Albums</h2>
          </div>
          <Separator className="my-4" />
          <HorizontalScroll>
            <div className="flex gap-4 pr-8">
              {albums.map((item) => (
                <AlbumCard
                  key={item.id}
                  id={item.id}
                  imageURL={item.image}
                  title={item.name}
                  type={item.type}
                  url={item.url}
                  songCount={item.songCount}
                  aspectRatio="portrait"
                  width={250}
                  height={330}
                />
              ))}
            </div>
          </HorizontalScroll>
        </section>
      )}
    </>
  );
};
