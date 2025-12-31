import { music } from "@/lib/music";
import { HomepageResponse } from "@/typings/homepage";

export const gethomepageData = async () => {
  try {
    const { data } = await music.get(`/search?query=Top%20Hits`);

    type HomePlaylist = {
      id: string;
      userId: string;
      title: string;
      subtitle: string;
      type: string;
      image: { quality: string; link: string }[];
      url: string;
      songCount: string;
      firstname: string;
      followerCount: string;
      lastUpdated: string;
      explicitContent: string;
    };

    const toImage = (img: any) => ({
      quality: img?.quality ?? "",
      link: img?.link ?? img?.url ?? "/playlist-placeholder.webp",
    });
    const toArtistsArray = (value: any) => {
      if (Array.isArray(value)) return value;
      if (typeof value === "string")
        return value
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean)
          .map((name) => ({ name }));
      return [];
    };
    const toAlbum = (album: any) => ({
      id: album.id,
      name: album.title ?? album.name ?? "",
      year: String(album.year ?? ""),
      type: album.type,
      playCount: String(album.playCount ?? ""),
      language: album.language ?? "",
      explicitContent: String(album.explicitContent ?? ""),
      songCount: String(album.songCount ?? album.songIds?.split(",")?.length ?? ""),
      url: album.url,
      primaryArtists: album.artist ? [album.artist] : [],
      featuredArtists: album.featuredArtists ?? [],
      artists: album.artists?.all ?? album.artists ?? [],
      image: album.image?.map(toImage) ?? [],
      songs: album.songs ?? [],
      releaseDate: album.releaseDate ?? "",
    });

    const toSong = (song: any) => ({
      id: song.id,
      name: song.title ?? song.name ?? "",
      type: song.type,
      album: song.album ?? { id: "", name: "", url: "" },
      year: String(song.year ?? ""),
      releaseDate: song.releaseDate ?? "",
      duration: String(song.duration ?? ""),
      label: song.label ?? "",
      primaryArtists: song.primaryArtists ?? song.singers ?? "",
      artists: toArtistsArray(song.primaryArtists ?? song.singers ?? []),
      featuredArtists: song.featuredArtists ?? [],
      explicitContent: String(song.explicitContent ?? ""),
      playCount: String(song.playCount ?? ""),
      language: song.language ?? "",
      url: song.url,
      image: song.image?.map(toImage) ?? [],
    });

    const albums = data.data?.albums?.results?.map(toAlbum) ?? [];
    const playlists: HomePlaylist[] =
      data.data?.playlists?.results?.map((p: any) => ({
        id: p.id,
        userId: "",
        title: p.name ?? p.title ?? "",
        subtitle: p.description ?? "",
        type: p.type,
        image: p.image?.map(toImage) ?? [],
        url: p.url,
        songCount: String(p.songCount ?? ""),
        firstname: "",
        followerCount: "",
        lastUpdated: "",
        explicitContent: String(p.explicitContent ?? ""),
      })) ?? [];

    const songs = data.data?.songs?.results?.map(toSong) ?? [];

    const payload: HomepageResponse = {
      status: data.success ? "SUCCESS" : "FAILED",
      message: null,
      data: {
        albums,
        playlists,
        charts: playlists.map((p: HomePlaylist) => ({
          ...p,
          subtitle: p.subtitle ?? "",
          firstname: p.firstname ?? "",
          explicitContent: p.explicitContent ?? "",
          language: "",
        })),
        trending: {
          songs,
          albums,
        },
      },
    };

    return payload;
  } catch (error) {
    console.log(error);
  }
};