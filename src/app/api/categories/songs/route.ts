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
      `/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
    );
    const results: any[] = data?.data?.results ?? [];
    const toImg = (img: any) => ({
      quality: img?.quality ?? "",
      link: img?.link ?? img?.url ?? "",
      url: img?.link ?? img?.url ?? "",
    });
    const toDl = (dl: any) => ({
      quality: dl?.quality ?? "",
      link: dl?.link ?? dl?.url ?? "",
      url: dl?.link ?? dl?.url ?? "",
    });
    const mapped = results.map((s) => ({
      id: s.id,
      name: s.name ?? s.title ?? "Untitled",
      title: s.name ?? s.title ?? "Untitled",
      type: s.type ?? "song",
      year: s.year ?? "",
      duration: s.duration ?? 0,
      language: s.language ?? "",
      url: s.url ?? "",
      image: (s.image ?? []).map(toImg),
      downloadUrl: (s.downloadUrl ?? []).map(toDl),
      primaryArtists:
        s.artists?.primary?.map((a: any) => a.name).join(", ") ??
        (typeof s.primaryArtists === "string" ? s.primaryArtists : ""),
      artists: s.artists ?? s.primaryArtists ?? s.singers ?? "",
      singers: s.singers ?? "",
      album: s.album ?? {},
      hasLyrics: s.hasLyrics ?? "",
      playCount: s.playCount ?? "",
    }));

    return NextResponse.json({ data: mapped, page, limit });
  } catch (error) {
    console.error("/api/categories/songs", error);
    return NextResponse.json({ data: [], error: "Failed to fetch" }, { status: 500 });
  }
}
