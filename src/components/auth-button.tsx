"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getInitials = (name?: string | null, email?: string | null) => {
  const source = name || email || "";
  const parts = source.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return "U";
};

export function AuthButton() {
  const { data, status } = useSession();
  const user = data?.user;

  if (status === "loading") {
    return <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />;
  }

  if (!user) {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex items-center justify-center h-10 w-10 rounded-full border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 shadow-lg transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/60"
          aria-label="Account menu"
        >
          {user.image ? (
            // Use plain img to avoid remote host allow-list issues
            <img
              src={user.image}
              alt={user.name ?? "user"}
              className="h-full w-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-full w-full rounded-full bg-gradient-to-br from-orange-400 to-fuchsia-500 text-white flex items-center justify-center text-sm font-semibold">
              {initials}
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 text-white shadow-2xl backdrop-blur-md p-0"
        align="end"
        sideOffset={10}
      >
        <div className="px-4 py-3 flex items-center gap-3 bg-slate-800/60 border-b border-white/5">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name ?? "user"}
              className="h-10 w-10 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-fuchsia-500 text-white flex items-center justify-center text-sm font-semibold">
              {initials}
            </div>
          )}
          <div className="text-sm leading-tight">
            <p className="font-semibold line-clamp-1">{user.name ?? "User"}</p>
            {user.email && <p className="text-white/70 text-xs line-clamp-1">{user.email}</p>}
          </div>
        </div>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          className="cursor-pointer px-4 py-3 text-sm font-medium text-white/90 transition duration-150 ease-out focus:bg-white/5 focus:text-white"
          onSelect={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-white">
              <Settings className="h-4 w-4" />
            </span>
            <div className="flex flex-col leading-tight">
              <span>Settings</span>
              <span className="text-xs text-white/60">Profile & preferences</span>
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer px-4 py-3 text-sm font-semibold text-rose-300 transition duration-150 ease-out focus:bg-rose-500/10 focus:text-rose-200"
          onSelect={() => signOut({ callbackUrl: "/" })}
        >
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500/15 text-rose-200">
              <LogOut className="h-4 w-4" />
            </span>
            <span>Logout</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}