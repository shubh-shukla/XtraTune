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
      `/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
    const results: any[] = data?.data?.results ?? [];
    const mapped = results.map((s) => ({
      id: s.id,
      title: s.name ?? s.title ?? "Untitled",
      image: s.image ?? [],
      type: s.type ?? "song",
      url: s.url ?? "",
      singers: s.singers ?? s.primaryArtists ?? "",
      artists: s.artists ?? s.primaryArtists ?? s.singers ?? "",
    }));

    return NextResponse.json({ data: mapped, page, limit });
  } catch (error) {
    console.error("/api/categories/songs", error);
    return NextResponse.json({ data: [], error: "Failed to fetch" }, { status: 500 });
  }
}
