import { music } from "@/lib/music";
import { type HomepageResponse } from "@/typings/homepage";

// ── Well-known JioSaavn curated playlist IDs ────────────────────────
const TRENDING_PLAYLIST_ID = "47599074"; // "Now Trending" – editorial
const TOP_CHARTS_PLAYLIST_ID = "1134548194"; // "India Superhits Top 50"
const NEW_RELEASES_PLAYLIST_ID = "6689255"; // "Taaza Tunes" – latest releases

const LIMIT = 30;

// ── Helpers ──────────────────────────────────────────────────────────
const toImage = (img: any) => ({
  quality: img?.quality ?? "",
  link: img?.link ?? img?.url ?? "/playlist-placeholder.webp",
});

const toArtistsArray = (value: any): { name: string }[] => {
  if (Array.isArray(value)) return value;
  // Handle the { primary, featured, all } shape from the API
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const all = value.all ?? value.primary ?? [];
    if (Array.isArray(all)) return all.map((a: any) => ({ name: a.name ?? "" }));
  }
  if (typeof value === "string")
    return value
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
  return [];
};

const toSong = (song: any) => ({
  id: song.id,
  name: song.title ?? song.name ?? "",
  type: song.type ?? "song",
  album: song.album ?? { id: "", name: "", url: "" },
  year: String(song.year ?? ""),
  releaseDate: song.releaseDate ?? "",
  duration: String(song.duration ?? ""),
  label: song.label ?? "",
  primaryArtists:
    song.primaryArtists ??
    song.artists?.primary?.map((a: any) => a.name).join(", ") ??
    song.singers ??
    "",
  artists: toArtistsArray(song.primaryArtists ?? song.artists ?? song.singers ?? []),
  featuredArtists: song.featuredArtists ?? [],
  explicitContent: String(song.explicitContent ?? ""),
  playCount: String(song.playCount ?? ""),
  language: song.language ?? "",
  url: song.url,
  image: song.image?.map(toImage) ?? [],
});

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

const toPlaylist = (p: any): HomePlaylist => ({
  id: p.id,
  userId: "",
  title: p.name ?? p.title ?? "",
  subtitle: p.description ?? "",
  type: p.type ?? "playlist",
  image: p.image?.map(toImage) ?? [],
  url: p.url,
  songCount: String(p.songCount ?? ""),
  firstname: "",
  followerCount: "",
  lastUpdated: "",
  explicitContent: String(p.explicitContent ?? ""),
});

// ── Fetch a curated JioSaavn playlist (returns full playlist with songs) ─────
const fetchPlaylist = async (playlistId: string) => {
  try {
    const { data } = await music.get(`/playlists?id=${playlistId}&limit=${LIMIT}`);
    return data?.data ?? null;
  } catch {
    return null;
  }
};

// ── Main homepage data fetcher ──────────────────────────────────────
// Optimized: only 3 parallel playlist fetches power the entire homepage.

let _inflight: Promise<HomepageResponse | undefined> | null = null;

export const gethomepageData = async (): Promise<HomepageResponse | undefined> => {
  if (_inflight) return _inflight;

  _inflight = _fetchHomeData().finally(() => {
    // Clear after a short window so the next request cycle re-fetches
    setTimeout(() => {
      _inflight = null;
    }, 500);
  });

  return _inflight;
};

const _fetchHomeData = async (): Promise<HomepageResponse | undefined> => {
  try {
    // 3 parallel calls cover the entire homepage (down from 6+)
    const [trendingRaw, topChartsRaw, newReleasesRaw] = await Promise.all([
      fetchPlaylist(TRENDING_PLAYLIST_ID),
      fetchPlaylist(TOP_CHARTS_PLAYLIST_ID),
      fetchPlaylist(NEW_RELEASES_PLAYLIST_ID),
    ]);

    // ── Trending section ────────────────────────────────────────
    const trendingSongs = (trendingRaw?.songs ?? []).map(toSong);

    const seenAlbumIds = new Set<string>();
    const trendingAlbums = trendingSongs
      .filter((s: any) => s.album?.id && !seenAlbumIds.has(s.album.id))
      .map((s: any) => {
        seenAlbumIds.add(s.album.id);
        return {
          id: s.album.id,
          name: s.album.name ?? "",
          year: s.year ?? "",
          type: "album",
          playCount: s.playCount ?? "",
          language: s.language ?? "",
          explicitContent: s.explicitContent ?? "",
          songCount: "",
          url: s.album.url ?? "",
          primaryArtists: [],
          featuredArtists: [],
          artists: s.artists ?? [],
          image: s.image ?? [],
          songs: [],
          releaseDate: s.releaseDate ?? "",
        };
      });

    // ── Top Charts / playlists (derived from the 3 playlists) ───
    const chartPlaylists: HomePlaylist[] = [trendingRaw, topChartsRaw, newReleasesRaw]
      .filter(Boolean)
      .map((raw: any) => toPlaylist(raw));

    // ── New Releases section ────────────────────────────────────
    const newReleaseSongs = (newReleasesRaw?.songs ?? []).map(toSong);
    const seenNewAlbumIds = new Set<string>();
    const newReleaseAlbums = newReleaseSongs
      .filter((s: any) => s.album?.id && !seenNewAlbumIds.has(s.album.id))
      .map((s: any) => {
        seenNewAlbumIds.add(s.album.id);
        return {
          id: s.album.id,
          name: s.album.name ?? "",
          year: s.year ?? "",
          type: "album",
          playCount: s.playCount ?? "",
          language: s.language ?? "",
          explicitContent: s.explicitContent ?? "",
          songCount: "",
          url: s.album.url ?? "",
          primaryArtists: [],
          featuredArtists: [],
          artists: s.artists ?? [],
          image: s.image ?? [],
          songs: [],
          releaseDate: s.releaseDate ?? "",
        };
      });

    const payload: HomepageResponse = {
      status: "SUCCESS",
      message: null,
      data: {
        albums: newReleaseAlbums.length > 0 ? newReleaseAlbums : trendingAlbums,
        playlists: chartPlaylists,
        charts: chartPlaylists.map((p) => ({
          ...p,
          subtitle: p.subtitle ?? "",
          firstname: p.firstname ?? "",
          explicitContent: p.explicitContent ?? "",
          language: "",
        })),
        trending: {
          songs: trendingSongs,
          albums: trendingAlbums,
        },
      },
    };

    return payload;
  } catch (error) {
    console.error(error);
  }
};
