import { type NextRequest, NextResponse } from "next/server";
import { music } from "@/lib/music";

/**
 * GET /api/artist/albums?id=<artistId>&page=0&limit=20
 *
 * Returns paginated albums for an artist via JioSaavn's /artists/{id}/albums endpoint.
 */

const clean = (s: string) =>
  (s ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"');

const toImage = (img: any) => ({
  quality: img?.quality ?? "",
  link: img?.link ?? img?.url ?? "/playlist-placeholder.webp",
});

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.trim();
  const page = req.nextUrl.searchParams.get("page") ?? "0";
  const limit = req.nextUrl.searchParams.get("limit") ?? "20";

  if (!id) {
    return NextResponse.json({ albums: [], total: 0 });
  }

  try {
    const { data } = await music.get(`/artists/${id}/albums?page=${page}&limit=${limit}`);

    const raw = data?.data ?? {};
    const albums = (raw.albums ?? raw.results ?? []).map((a: any) => ({
      id: a.id ?? "",
      name: clean(a.title ?? a.name ?? ""),
      year: String(a.year ?? ""),
      type: a.type ?? "album",
      songCount: String(a.songCount ?? ""),
      language: a.language ?? "",
      url: a.url ?? "",
      image: a.image?.map(toImage) ?? [],
      artists:
        a.artists?.primary?.map((ar: any) => ({ name: ar.name ?? "" })) ??
        (typeof a.artist === "string" ? [{ name: a.artist }] : []),
      releaseDate: a.releaseDate ?? "",
    }));

    return NextResponse.json({
      albums,
      total: raw.total ?? albums.length,
    });
  } catch (err) {
    console.error("[api/artist/albums]", err);
    return NextResponse.json({ albums: [], total: 0 });
  }
}
