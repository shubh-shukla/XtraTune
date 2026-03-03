"use client";

import { useSession } from "next-auth/react";
import useSWR from "swr";
import type { SessionPayload } from "@/lib/session";

const fetcher = (url: string) =>
  fetch(url, { credentials: "same-origin" }).then((r) => {
    if (!r.ok) return null;
    return r.json();
  });

/**
 * useAuth – unified auth hook.
 *
 * Combines NextAuth's client session (for OAuth UI) with our httpOnly cookie session
 * (for secure backend calls). The hook exposes a single `user` object and status.
 *
 * Works for both logged-in and guest (non-login) users.
 */
export function useAuth() {
  const { data: nextAuthSession, status: nextAuthStatus } = useSession();

  // Also fetch our own session from the httpOnly cookie
  const { data: meData, mutate: refreshMe } = useSWR<{ user: SessionPayload | null }>(
    nextAuthStatus === "authenticated" ? "/api/user/me" : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  const isLoading = nextAuthStatus === "loading";
  const isAuthenticated = nextAuthStatus === "authenticated";
  const nextAuthUser = nextAuthSession?.user as any;

  // Prefer our session payload (has userId), fall back to NextAuth user
  const user = meData?.user
    ? {
        id: meData.user.userId,
        email: meData.user.email,
        name: meData.user.name,
        image: meData.user.image,
        provider: meData.user.provider,
      }
    : isAuthenticated && nextAuthUser
      ? {
          id: nextAuthUser.id ?? "",
          email: nextAuthUser.email ?? "",
          name: nextAuthUser.name ?? "",
          image: nextAuthUser.image ?? "",
          provider: nextAuthUser.provider ?? "",
        }
      : null;

  return {
    user,
    isLoading,
    isAuthenticated,
    isGuest: !isAuthenticated,
    refreshMe,
  };
}
