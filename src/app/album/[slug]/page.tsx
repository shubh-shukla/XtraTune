import { AlbumPageCard } from "@/components/album-page-card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { music } from "@/lib/music";
import { AlbumData } from "@/typings/albumdata";
import { Playlist } from "@/typings/playlist";
import Image from "next/image";
import { Balancer } from "react-wrap-balancer";
import { AlbumPlayBtn } from "./album-play-btn";

const getAlbumData = async (slug: string) => {
  const type = slug.split("-")[1];
  const id = slug.split("-")[0];
  const toImage = (img: any) => ({ ...img, link: img.url });
  const toDownload = (dl: any) => ({ ...dl, link: dl.url });
  const toSong = (song: any) => ({
    ...song,
    primaryArtists: song.artists?.primary?.map((a: any) => a.name).join(", ") ?? "",
    primaryArtistsId: song.artists?.primary?.map((a: any) => a.id).join(", ") ?? "",
    featuredArtists: song.artists?.featured?.map((a: any) => a.name).join(", ") ?? "",
    featuredArtistsId: song.artists?.featured?.map((a: any) => a.id).join(", ") ?? "",
    image: song.image?.map(toImage) ?? [],
    downloadUrl: song.downloadUrl?.map(toDownload) ?? [],
  });

  if (type == "album") {
    const { data } = await music.get(`/albums?id=${id}`);
    const normalized: AlbumData = {
      status: data.success ? "SUCCESS" : "FAILED",
      message: null,
      data: {
        ...data.data,
        primaryArtistsId: data.data?.artists?.primary?.map((a: any) => a.id).join(", ") ?? "",
        primaryArtists: data.data?.artists?.primary?.map((a: any) => a.name).join(", ") ?? "",
        featuredArtists: data.data?.artists?.featured ?? [],
        artists: data.data?.artists?.all ?? [],
        image: data.data?.image?.map(toImage) ?? [],
        songs: data.data?.songs?.map(toSong) ?? [],
        songCount: String(data.data?.songCount ?? "0"),
        releaseDate: data.data?.releaseDate ?? "",
        year: String(data.data?.year ?? ""),
      },
    };

    return normalized;
  } else 
  if (type == "artist") {
    const { data } = await music.get(`/artists/${id}`);
    const songsRes = await music.get(`/artists/${id}/songs?page=0&limit=50`);

    const normalized: AlbumData = {
      status: data.success ? "SUCCESS" : "FAILED",
      message: null,
      data: {
        ...(data.data ?? {}),
        primaryArtistsId: data.data?.artists?.primary?.map((a: any) => a.id).join(", ") ?? "",
        primaryArtists: data.data?.artists?.primary?.map((a: any) => a.name).join(", ") ?? "",
        featuredArtists: data.data?.artists?.featured ?? [],
        artists: data.data?.artists?.all ?? [],
        image: data.data?.image?.map(toImage) ?? [],
        songs: songsRes.data?.data?.songs?.map(toSong) ?? [],
        songCount: String(data.data?.songCount ?? songsRes.data?.data?.songs?.length ?? "0"),
        releaseDate: data.data?.releaseDate ?? "",
        year: String(data.data?.year ?? ""),
      },
    };

    return normalized;
  } else 
  {
    const pageSize = 100;
    let page = 0;
    let allSongs: any[] = [];
    let firstPayload: any = null;

    // Paginate until we exhaust the playlist to avoid the default 10-item limit.
    // Break conditions: returned page smaller than limit, or we collected declared songCount.
    while (true) {
      const { data } = await music.get(`/playlists?id=${id}&page=${page}&limit=${pageSize}`);
      if (!firstPayload) firstPayload = data;
      const batch = data?.data?.songs ?? [];
      allSongs = allSongs.concat(batch);

      const declaredCount = Number(data?.data?.songCount ?? allSongs.length);
      const fetchedEnough = allSongs.length >= declaredCount;
      const noMore = batch.length < pageSize;
      if (noMore || fetchedEnough) break;
      page += 1;
    }

    const normalized: Playlist = {
      status: firstPayload?.success ? "SUCCESS" : "FAILED",
      message: null,
      data: {
        ...(firstPayload?.data ?? {}),
        image: firstPayload?.data?.image?.map(toImage) ?? [],
        songs: allSongs.map(toSong) ?? [],
        songCount: String(firstPayload?.data?.songCount ?? allSongs.length ?? "0"),
      },
    };

    return normalized;
  }
};
export default async function Page({ params }: { params: { slug: string } }) {
  let album: AlbumData | Playlist;
  try {
    album = await getAlbumData(params.slug);
  } catch (error) {
    console.log(error);
    return <h2>Error</h2>;
  }
  if (album.data.songs.length === 0) return <h2>Invalid URL</h2>;
  const imageURL =
    album.data?.image[2]?.link ||
    album?.data?.image[1]?.link ||
    album?.data?.image[0]?.link ||
    "/playlist-placeholder.webp";
  return (
    <section className="px-4  pt-4 space-y-12 mt-6 lg:space-y-0 lg:grid grid-cols-2 gap-x-4 ">
      <section className="mx-auto lg:mx-0 max-w-md ">
        <div className="lg:sticky top-5">
          <div className="w-full overflow-hidden  rounded-lg">
            <AspectRatio ratio={1 / 1} className="bg-muted">
              <Image
                src={imageURL}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                alt={album.data.name}
                className=" object-cover object-center  transition-transform hover:scale-105  "
              />
            </AspectRatio>
          </div>
          <h1 className="font-cal text-2xl  mt-4 ">
            <Balancer>{album.data.name.split("(")[0].replace("&#039;","'")}</Balancer>
          </h1>
          <div className="flex justify-between gap-x-2 items-center">
            <div>
              {/* @ts-ignore */}
              {album?.data?.primaryArtists ? (
                <p className="line-clamp-1">
                  by {(album as AlbumData).data.primaryArtists}
                </p>
              ) : (
                <p className="line-clamp-1">
                  by {(album as Playlist).data.username}
                </p>
              )}

              <p>
                {album.data.songCount}{" "}
                {album.data.songCount == "1" ? "Song" : "Songs"}
              </p>
            </div>
            <AlbumPlayBtn album={album.data.songs} />
          </div>
        </div>
      </section>
      <section>
        <h2 className="font-cal text-2xl  my-4 ">
          <Balancer>All Songs</Balancer>
        </h2>
        <div className="flex flex-col gap-3 sm:gap-5 ">
          {album.data.songs.map((song) => (
            <AlbumPageCard key={song.id + song.name} {...song} />
          ))}
        </div>
      </section>
    </section>
  );
}
