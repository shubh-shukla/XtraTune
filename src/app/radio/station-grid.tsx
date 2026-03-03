"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Station = {
  id: string;
  name: string;
  type: string;
  image: { quality: string; url: string; link?: string }[];
  url: string;
  songCount: number;
  description: string;
};

type StationSection = {
  title: string;
  emoji: string;
  stations: Station[];
};

function getImageUrl(images: Station["image"]): string {
  // Prefer highest quality
  for (let i = images.length - 1; i >= 0; i--) {
    const link = images[i]?.url || images[i]?.link;
    if (link) return link;
  }
  return "/playlist-placeholder.webp";
}

export function StationGrid({ section }: { section: StationSection }) {
  const router = useRouter();

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-cal font-semibold tracking-wide flex items-center gap-2">
        <span>{section.emoji}</span> {section.title}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {section.stations.map((station) => (
          <button
            key={station.id}
            onClick={() => router.push(`/album/${station.id}-playlist`)}
            className="group text-left space-y-2 rounded-xl transition active:scale-[0.97] cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-xl aspect-square shadow-md">
              <Image
                src={getImageUrl(station.image)}
                alt={station.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                className="object-cover transition-transform group-hover:scale-105"
              />
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                <div
                  className={cn(
                    "grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg",
                    "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0",
                    "transition-all duration-200",
                  )}
                >
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                </div>
              </div>
            </div>
            <div className="px-1">
              <h3 className="font-medium text-sm line-clamp-1 text-foreground">
                {station.name.replace(/&amp;/g, "&")}
              </h3>
              {station.songCount > 0 && (
                <p className="text-xs text-muted-foreground">{station.songCount} songs</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
