"use client";

import { useEffect, useMemo, useRef } from "react";
import useSWRInfinite from "swr/infinite";
import { SongCard } from "@/components/song-card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 20;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const mapImage = (image?: { link?: string; url?: string }[]) => {
  if (!image) return [{ link: "/song-placeholder.webp" }];
  return image.map((img) => ({ link: img?.link ?? img?.url ?? "/song-placeholder.webp" }));
};

const mapArtists = (value: any) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string")
    return value
      .split(",")
      .map((name) => ({ name: name.trim() }))
      .filter((a) => a.name);
  return [];
};

function flatten<T>(pages: T[][]) {
  return pages.reduce((acc, page) => acc.concat(page), [] as T[]);
}

export function CategorySongFeed({ query }: { query: string }) {
  const observerRef = useRef<HTMLDivElement | null>(null);

  const { data, size, setSize, isValidating } = useSWRInfinite(
    (index) => `/api/categories/songs?query=${encodeURIComponent(query)}&page=${index}&limit=${PAGE_SIZE}`,
    fetcher,
    {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
    }
  );

  const items = useMemo(() => {
    if (!data) return [] as any[];
    return flatten(
      data.map((page) =>
        (page?.data ?? []).map((s: any) => ({
          id: s.id,
          title: s.title,
          image: mapImage(s.image),
          type: s.type,
          url: s.url,
          singers: s.singers,
          artists: mapArtists(s.artists),
        }))
      )
    );
  }, [data]);

  const isLoading = !data;
  const reachedEnd = data && data[data.length - 1]?.data?.length < PAGE_SIZE;

  useEffect(() => {
    const sentinel = observerRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !reachedEnd && !isValidating) {
          setSize((prev) => prev + 1);
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [reachedEnd, isValidating, setSize]);

  return (
    <section className="space-y-4">
      <Separator className="my-2" />
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 pb-4">
        {items.map((item) => (
          <SongCard
            key={item.id}
            id={item.id}
            imageURL={item.image}
            title={item.title}
            type={item.type}
            url={item.url}
            singer={item.singers}
            artists={item.artists}
            aspectRatio="square"
            width={220}
            height={220}
            className="w-full"
          />
        ))}
        {(isLoading || isValidating) &&
          Array.from({ length: 8 }).map((_, idx) => (
            <div key={`sk-s-${idx}`} className="space-y-2">
              <Skeleton className="w-full h-[220px] rounded-md" />
              <Skeleton className="w-3/4 h-4" />
            </div>
          ))}
        {reachedEnd && items.length === 0 && (
          <p className="text-muted-foreground">No songs found.</p>
        )}
      </div>
      <div ref={observerRef} className="h-10" />
    </section>
  );
}
