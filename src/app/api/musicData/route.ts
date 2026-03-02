import { type NextRequest, NextResponse } from "next/server";
import { music } from "@/lib/music";

const toImage = (img: any) => ({
  ...(img ?? {}),
  quality: img?.quality ?? "",
  link: img?.link ?? img?.url ?? "",
});

const toDownload = (dl: any) => ({
  ...(dl ?? {}),
  link: dl?.link ?? dl?.url ?? "",
});

const clean = (s: string) =>
  (s ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"');

// ── GET /api/musicData?type=album|playlist|artist&id=xxx
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type")?.trim();
  const id = req.nextUrl.searchParams.get("id")?.trim();

  if (!type || !id) {
    return NextResponse.json({ status: "ERROR", data: null }, { status: 400 });
  }

  try {
    let endpoint = "";
    if (type === "album") endpoint = `/albums?id=${id}`;
    else if (type === "playlist") endpoint = `/playlists?id=${id}`;
    else if (type === "artist") endpoint = `/artists/${id}`;
    else {
      return NextResponse.json({ status: "ERROR", data: null }, { status: 400 });
    }

    const { data } = await music.get(endpoint);
    const raw = data?.data ?? data ?? {};

    // Normalize common fields
    if (type === "album" || type === "playlist") {
      const songs = (raw.songs ?? []).map((s: any) => ({
        ...s,
        name: clean(s.title ?? s.name ?? ""),
        primaryArtists:
          s.artists?.primary?.map((a: any) => a.name).join(", ") ?? s.primaryArtists ?? "",
        featuredArtists:
          s.artists?.featured?.map((a: any) => a.name).join(", ") ?? s.featuredArtists ?? "",
        image: s.image?.map(toImage) ?? [],
        downloadUrl: s.downloadUrl?.map(toDownload) ?? [],
      }));

      return NextResponse.json(
        {
          status: "SUCCESS",
          data: {
            id: raw.id ?? id,
            name: clean(raw.name ?? raw.title ?? ""),
            description: raw.description ?? "",
            year: raw.year ?? "",
            type: raw.type ?? type,
            songCount: String(raw.songCount ?? songs.length),
            image: raw.image?.map(toImage) ?? [],
            songs,
            artists: raw.artists?.primary?.map((a: any) => ({ name: a.name ?? "" })) ?? [],
            url: raw.url ?? "",
            language: raw.language ?? "",
          },
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        },
      );
    }

    // Artist
    return NextResponse.json(
      {
        status: "SUCCESS",
        data: {
          id: raw.id ?? id,
          name: clean(raw.name ?? ""),
          image: raw.image?.map(toImage) ?? [],
          followerCount: raw.followerCount ?? "",
          fanCount: raw.fanCount ?? "",
          isVerified: raw.isVerified ?? false,
          bio: raw.bio ?? [],
          dominantType: raw.dominantType ?? "",
          url: raw.url ?? "",
          topSongs: (raw.topSongs ?? []).map((s: any) => ({
            ...s,
            name: clean(s.title ?? s.name ?? ""),
            primaryArtists: s.artists?.primary?.map((a: any) => a.name).join(", ") ?? "",
            image: s.image?.map(toImage) ?? [],
            downloadUrl: s.downloadUrl?.map(toDownload) ?? [],
          })),
          topAlbums: (raw.topAlbums ?? []).map((a: any) => ({
            id: a.id ?? "",
            name: clean(a.title ?? a.name ?? ""),
            image: a.image?.map(toImage) ?? [],
            year: a.year ?? "",
            type: a.type ?? "album",
            url: a.url ?? "",
          })),
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (err) {
    console.error("[api/musicData GET]", err);
    return NextResponse.json({ status: "ERROR", data: null }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { searchParams: _searchParams } = new URL(req.url);
  const Request = await req.json();
  const id = Request.id;
  if (!id) throw new Error("No id provided");
  const { data } = await music.get(`/songs/${id}`);

  const normalized = Array.isArray(data?.data)
    ? data.data.map((song: any) => ({
        ...song,
        primaryArtists: song.artists?.primary?.map((a: any) => a.name).join(", ") ?? "",
        primaryArtistsId: song.artists?.primary?.map((a: any) => a.id).join(", ") ?? "",
        featuredArtists: song.artists?.featured?.map((a: any) => a.name).join(", ") ?? "",
        featuredArtistsId: song.artists?.featured?.map((a: any) => a.id).join(", ") ?? "",
        image: song.image?.map((img: any) => ({ ...img, link: img.url })) ?? [],
        downloadUrl: song.downloadUrl?.map((dl: any) => ({ ...dl, link: dl.url })) ?? [],
      }))
    : [];

  return NextResponse.json(
    { status: "SUCCESS", message: null, data: normalized },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
