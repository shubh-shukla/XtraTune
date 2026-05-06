"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url, { credentials: "same-origin" }).then((r) => r.json());

export function useSmartPlaylists() {
  const { data, isLoading } = useSWR("/api/smart-playlists", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5 * 60 * 1000,
  });
  return { playlists: data?.playlists ?? [], source: data?.source, isLoading };
}
