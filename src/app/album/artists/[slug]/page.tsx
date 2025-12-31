import { AlbumPageCard } from "@/components/album-page-card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { music } from "@/lib/music";
import Image from "next/image";
import { Balancer } from "react-wrap-balancer";
import { AlbumPlayBtn } from "./album-play-btn";
import { ArtistDetails } from "@/typings/artist-details";
import { ArtistSongs } from "@/typings/artist-songs";
import axios from "axios";

const getArtistData = async (slug: string) => {
  const id = slug.split("/")[0];
  try {
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

    const [detailRes, songsRes] = await axios.all([
      music.get(`/artists/${id}`),
      music.get(`/artists/${id}/songs?page=0&limit=50`),
    ]);

    const artistDetail: ArtistDetails = {
      ...detailRes.data.data,
      image: detailRes.data.data?.image?.map(toImage) ?? [],
      followerCount: String(detailRes.data.data?.followerCount ?? "0"),
      fanCount: String(detailRes.data.data?.fanCount ?? "0"),
      isVerified: Boolean(detailRes.data.data?.isVerified),
      dominantLanguage: detailRes.data.data?.dominantLanguage ?? "",
      dominantType: detailRes.data.data?.dominantType ?? "",
      bio: detailRes.data.data?.bio ?? [],
      dob: detailRes.data.data?.dob ?? "",
      fb: detailRes.data.data?.fb ?? "",
      twitter: detailRes.data.data?.twitter ?? "",
      wiki: detailRes.data.data?.wiki ?? "",
      availableLanguages: detailRes.data.data?.availableLanguages ?? [],
      isRadioPresent: Boolean(detailRes.data.data?.isRadioPresent),
    };

    const artistSongs: ArtistSongs = {
      total: songsRes.data?.data?.total ?? 0,
      lastPage:
        (songsRes.data?.data?.songs?.length ?? 0) <
        (Number(songsRes.data?.data?.limit ?? 50)),
      results: songsRes.data?.data?.songs?.map(toSong) ?? [],
    };

    return {
      artistDetail,
      artistSongs,
    };
  } catch (e) {
    return null;
  }
};
export default async function Page({ params }: { params: { slug: string } }) {
  let album: {
    artistDetail: ArtistDetails;
    // artistPlaylist: ArtistPlaylist;
    artistSongs: ArtistSongs;
  } | null;
  try {
    album = await getArtistData(params.slug);
  } catch (error) {
    console.log(error);
    return <h2>Error</h2>;
  }
  if (album === null) return <h2>{JSON.stringify(album)}</h2>;

  const imageURL =
    album?.artistDetail.image[2]?.link ||
    album?.artistDetail.image[1]?.link ||
    album?.artistDetail.image[0]?.link ||
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
                alt={album.artistDetail.name}
                className=" object-cover object-center  transition-transform hover:scale-105  "
              />
            </AspectRatio>
          </div>
          <h1 className="font-cal text-2xl  mt-4 ">
            <Balancer>
              {album.artistDetail.name.split("(")[0].replace("&#039;", "'")}
            </Balancer>
          </h1>
          <div className="flex justify-between gap-x-2 items-center">
            <div>
              <p className="line-clamp-1 text-white">
                {album.artistDetail.isVerified
                  ? "Verified Account"
                  : "Non-Verified Account"}
              </p>

              <p>{album.artistSongs.results.length} Songs </p>
            </div>
            <AlbumPlayBtn album={album.artistSongs.results} />
          </div>
        </div>
      </section>
      <section>
        {album.artistSongs.results?.length > 0 && (
          <>
            <h2 className="font-cal text-2xl  my-4 ">
              <Balancer>Popular Songs</Balancer>
            </h2>

            <div className="flex flex-col gap-3 sm:gap-5 ">
              {album.artistSongs.results?.map((song) => (
                <AlbumPageCard
                  key={song.id + song.name}
                  duration={song.duration}
                  id={song.id}
                  image={song.image}
                  name={song.name}
                  primaryArtists={song.primaryArtists}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </section>
  );
}
