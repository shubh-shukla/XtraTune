import { AlbumCard } from "@/components/album-card";
import { SongCard } from "@/components/song-card";
import { HorizontalScroll } from "@/components/ui/horizontal-scroll";
import { Separator } from "@/components/ui/separator";
import { type Album } from "@/typings/homepage";

export const Albums = ({ albums }: { albums: Album[] }) => {
  return (
    <section className="space-y-4 border-none">
      <div className="mt-6 space-y-1">
        <h2 className="text-3xl font-cal font-semibold tracking-wide ">New Releases</h2>
      </div>
      <Separator className="my-4" />
      <HorizontalScroll>
        <div className="flex gap-4 pr-8">
          {albums.map((item) => {
            if (item.type === "song")
              return (
                <SongCard
                  aspectRatio="portrait"
                  width={250}
                  height={330}
                  key={item.id}
                  id={item.id}
                  imageURL={item.image}
                  title={item.name}
                  type={item.type}
                  url={item.url}
                  artists={item.primaryArtists}
                />
              );
            else
              return (
                <AlbumCard
                  key={item.id}
                  id={item.id}
                  imageURL={item.image}
                  title={item.name}
                  type={item.type}
                  url={item.url}
                  aspectRatio="portrait"
                  width={250}
                  height={330}
                  artists={item.artists}
                />
              );
          })}
        </div>
      </HorizontalScroll>
    </section>
  );
};
