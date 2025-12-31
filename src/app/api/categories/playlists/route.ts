import { NextResponse } from "next/server";
import { music } from "@/lib/music";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") ?? "";
  const page = Number(searchParams.get("page") ?? 0);
  const limit = Number(searchParams.get("limit") ?? 20);

  if (!query) {
    return NextResponse.json({ data: [], error: "Missing query" }, { status: 400 });
  }

  try {
    const { data } = await music.get(
      `/search/playlists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
    const results: any[] = data?.data?.results ?? [];
    const mapped = results.map((p) => ({
      id: p.id,
      title: p.name ?? p.title ?? "Untitled",
      image: p.image ?? [],
      type: p.type ?? "playlist",
      url: p.url ?? "",
      songCount: String(p.songCount ?? ""),
      language: p.language ?? "",
      artists: p.artists ?? p.primaryArtists ?? "",
    }));

    return NextResponse.json({ data: mapped, page, limit });
  } catch (error) {
    console.error("/api/categories/playlists", error);
    return NextResponse.json({ data: [], error: "Failed to fetch" }, { status: 500 });
  }
}
