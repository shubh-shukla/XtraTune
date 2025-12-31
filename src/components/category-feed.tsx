"use client";

import { useEffect, useMemo, useRef } from "react";
import useSWRInfinite from "swr/infinite";
import { AlbumCard } from "@/components/album-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 20;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const mapImage = (image?: { link?: string; url?: string }[]) => {
  if (!image) return [{ link: "/playlist-placeholder.webp" }];
  return image.map((img) => ({ link: img?.link ?? img?.url ?? "/playlist-placeholder.webp" }));
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

export function CategoryFeed({ query }: { query: string }) {
  const observerRef = useRef<HTMLDivElement | null>(null);

  const { data, size, setSize, isValidating } = useSWRInfinite(
    (index) => `/api/categories/playlists?query=${encodeURIComponent(query)}&page=${index}&limit=${PAGE_SIZE}`,
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
        (page?.data ?? []).map((p: any) => ({
          id: p.id,
          title: p.title,
          image: mapImage(p.image),
          type: p.type,
          url: p.url,
          songCount: p.songCount,
          language: p.language,
          artists: mapArtists(p.artists),
        }))
      )
    );
  }, [data]);

  const isLoading = !data;
  const pageHasData = (pageIndex: number) => Boolean(data?.[pageIndex]?.data?.length);
  const reachedEnd = data && data[data.length - 1]?.data?.length < PAGE_SIZE;

  // Intersection observer to auto-load more near end of list
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
      <ScrollArea>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 pb-4">
          {items.map((item) => (
            <AlbumCard
              key={item.id}
              id={item.id}
              imageURL={item.image}
              title={item.title}
              type={item.type}
              url={item.url}
              songCount={item.songCount}
              language={item.language}
              aspectRatio="square"
              width={220}
              height={220}
              className="w-full"
              artists={item.artists}
            />
          ))}
          {(isLoading || isValidating) &&
            Array.from({ length: 8 }).map((_, idx) => (
              <div key={`sk-${idx}`} className="space-y-2">
                <Skeleton className="w-full h-[220px] rounded-md" />
                <Skeleton className="w-3/4 h-4" />
              </div>
            ))}
          {reachedEnd && items.length === 0 && (
            <p className="text-muted-foreground">No playlists found.</p>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
        <div ref={observerRef} className="h-10" />
      </ScrollArea>
    </section>
  );
}
