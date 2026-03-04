"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { useAuth } from "./use-auth";
import { useCsrf, apiFetch } from "./use-csrf";
import type { LikeEntityType } from "@/store/likes-slice";

export { type LikeEntityType };

const fetcher = (url: string) =>
  fetch(url, { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : { ids: [], count: 0 }));

/**
 * useFavorites – server-only favorites (requires authentication).
 *
 * Logged-in users:
 *   - Fetches favorites from the DB via SWR.
 *   - toggle() sends POST to /api/user/favorites and uses optimistic SWR update.
 *
 * Guest users:
 *   - ids is always [], isLiked always false.
 *   - toggle() is a no-op (components should guard with `needsAuth`).
 */
export function useFavorites(entityType: LikeEntityType = "track") {
  const { isAuthenticated } = useAuth();
  const csrf = useCsrf();

  // Server-side favorites – only fetched when logged in
  const { data: serverData, mutate: refreshServer } = useSWR<{ ids: string[]; count: number }>(
    isAuthenticated ? `/api/user/favorites?type=${entityType}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  );

  const ids = useMemo(() => serverData?.ids ?? [], [serverData?.ids]);
  const idSet = useMemo(() => new Set(ids), [ids]);

  const isLiked = useCallback((id: string) => idSet.has(id), [idSet]);

  const toggle = useCallback(
    async (id: string) => {
      if (!isAuthenticated) return;

      // Optimistic SWR update
      const prev = serverData ?? { ids: [], count: 0 };
      const liked = prev.ids.includes(id);
      const nextIds = liked ? prev.ids.filter((x) => x !== id) : [...prev.ids, id];
      const optimistic = { ids: nextIds, count: nextIds.length };

      // Apply optimistic data, skip revalidation
      refreshServer(optimistic, false);

      // Persist to server
      try {
        const res = await apiFetch(
          "/api/user/favorites",
          {
            method: "POST",
            body: JSON.stringify({ entityType, entityId: id }),
          },
          csrf,
        );
        if (!res.ok) {
          // Revert on failure
          refreshServer(prev, false);
        }
        // Success – keep optimistic data as-is; no revalidation needed
        // The POST already toggled the DB, so the optimistic data is correct.
      } catch {
        // Revert on error
        refreshServer(prev, false);
      }
    },
    [isAuthenticated, entityType, csrf, serverData, refreshServer],
  );

  return {
    ids,
    isLiked,
    toggle,
    /** true while auth is known but server data hasn't loaded yet */
    isLoading: isAuthenticated && !serverData,
    /** true when the user must sign in to use likes */
    needsAuth: !isAuthenticated,
  };
}
