import { music } from "@/lib/music";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
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
        downloadUrl:
          song.downloadUrl?.map((dl: any) => ({ ...dl, link: dl.url })) ?? [],
      }))
    : [];

  return NextResponse.json({ status: "SUCCESS", message: null, data: normalized });
}
