"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url, { credentials: "same-origin" }).then((r) => r.json());

export function useRecommendations() {
  const { data, error, isLoading, mutate } = useSWR("/api/recommendations", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
  return {
    items: data?.items ?? [],
    source: data?.source ?? null,
    error,
    isLoading,
    refresh: mutate,
  };
}
