"use client";
import { Home, LayoutGrid, Heart, Radio, ListMusic, Settings, Music } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icons } from "./icons";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/categories", label: "Categories", icon: LayoutGrid },
  { href: "/favourites", label: "Favourites", icon: Heart },
  { href: "/radio", label: "Radio", icon: Radio },
  { href: "/playlists", label: "My Playlists", icon: ListMusic },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

const quickPlaylists = [
  { href: "/search/Arijit%20Singh", label: "Let's Play - Arijit Singh" },
  { href: "/search/2000s%20Duets", label: "2000s Duets" },
  { href: "/search/Kumar%20Sanu", label: "Let's Play - Kumar Sanu" },
  { href: "/search/Indipop%20Hits", label: "Best Of Indipop" },
] as const;

export const Sidebar = () => {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:flex-col md:col-span-2 sticky top-0 h-screen overflow-y-auto sidebar-surface">
      {/* Logo */}
      <div className="px-5 lg:px-6 pt-7 pb-2">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 transition-transform group-hover:scale-105">
            <Icons.xtratune size={18} />
          </div>
          <span className="text-lg font-cal tracking-tight text-foreground">XtraTune</span>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="mt-8 px-3 lg:px-4 flex-1">
        <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Menu
        </p>
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "group/link relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted",
                  )}
                >
                  <Icon
                    size={18}
                    className={cn(
                      "shrink-0 transition-transform duration-200 group-hover/link:scale-110",
                    )}
                  />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Playlists */}
        <div className="mt-10">
          <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Quick Picks
          </p>
          <ul className="space-y-0.5">
            {quickPlaylists.map((pl) => (
              <li key={pl.href}>
                <Link
                  href={pl.href}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-foreground/50 transition-colors duration-150 hover:text-foreground hover:bg-muted"
                >
                  <Music size={14} className="shrink-0" />
                  <span className="truncate">{pl.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Bottom gradient accent */}
      <div className="mx-5 mb-5 mt-2 h-1 rounded-full bg-gradient-to-r from-orange-500/50 via-amber-400/40 to-transparent" />
    </aside>
  );
};
