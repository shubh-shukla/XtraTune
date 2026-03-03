"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/** Cached CSRF token – refreshed automatically by SWR */
export function useCsrf() {
  const { data } = useSWR<{ csrfToken: string }>("/api/csrf", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5 * 60 * 1000, // 5 min
  });
  return data?.csrfToken ?? "";
}

/**
 * Helper for mutating API calls that automatically attaches the CSRF header.
 * Usage:  await apiFetch("/api/user/favorites", { method:"POST", body:... }, csrfToken)
 */
export async function apiFetch(
  url: string,
  init: RequestInit = {},
  csrfToken?: string,
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (csrfToken) {
    headers.set("x-csrf-token", csrfToken);
  }
  return fetch(url, { ...init, headers, credentials: "same-origin" });
}
