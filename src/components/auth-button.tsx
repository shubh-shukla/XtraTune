"use client";

import { LogOut, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { clearLikes } from "@/store/likes-slice";
import { store } from "@/store/store";

const getInitials = (name?: string | null, email?: string | null) => {
  const source = name || email || "";
  const parts = source.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return "U";
};

export function AuthButton() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />;
  }

  const handleSignOut = async () => {
    // Clear localStorage likes/saves so they don't leak to guest mode
    store.dispatch(clearLikes());
    // Clear the httpOnly session cookie via our API
    try {
      await fetch("/api/user/logout", { method: "POST", credentials: "same-origin" });
    } catch {}
    // Then do NextAuth sign-out
    signOut({ callbackUrl: "/" });
  };

  if (!isAuthenticated || !user) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => signIn(undefined, { callbackUrl: "/" })}
        className="rounded-full"
      >
        Sign in
      </Button>
    );
  }

  const initials = getInitials(user.name, user.email);

  return (
    <div className="relative inline-flex">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="relative flex items-center justify-center h-10 w-10 rounded-full border border-border bg-muted shadow-lg transition duration-150 ease-out hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/60"
            aria-label="Account menu"
          >
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "user"}
                width={40}
                height={40}
                className="h-full w-full rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="h-full w-full rounded-full bg-gradient-to-br from-orange-400 to-fuchsia-500 text-white flex items-center justify-center text-sm font-semibold">
                {initials}
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-64 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl backdrop-blur-md p-0"
          align="end"
          sideOffset={4}
        >
          <div className="px-4 py-3 flex items-center gap-3 bg-muted/50 border-b border-border">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "user"}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-fuchsia-500 text-white flex items-center justify-center text-sm font-semibold">
                {initials}
              </div>
            )}
            <div className="text-sm leading-tight">
              <p className="font-semibold line-clamp-1">{user.name ?? "User"}</p>
              {user.email && (
                <p className="text-muted-foreground text-xs line-clamp-1">{user.email}</p>
              )}
            </div>
          </div>
          <DropdownMenuSeparator className="bg-border" />
          <DropdownMenuItem
            className="cursor-pointer px-4 py-3 text-sm font-medium text-popover-foreground transition duration-150 ease-out focus:bg-muted"
            asChild
          >
            <Link href="/settings">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-foreground">
                  <Settings className="h-4 w-4" />
                </span>
                <div className="flex flex-col leading-tight">
                  <span>Settings</span>
                  <span className="text-xs text-muted-foreground">Profile & preferences</span>
                </div>
              </div>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer px-4 py-3 text-sm font-semibold text-destructive transition duration-150 ease-out focus:bg-destructive/10"
            onSelect={() => handleSignOut()}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-destructive/15 text-destructive">
                <LogOut className="h-4 w-4" />
              </span>
              <span>Logout</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
