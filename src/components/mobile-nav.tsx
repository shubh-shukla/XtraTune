"use client";

import { Heart, Home, LayoutGrid, Radio, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/categories", label: "Browse", icon: LayoutGrid },
  { href: "/favourites", label: "Likes", icon: Heart },
  { href: "/radio", label: "Radio", icon: Radio },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-[70px] left-0 right-0 z-40 flex md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.04)] dark:bg-background/80 dark:shadow-none">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-all duration-200",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200",
                active && "bg-primary/12 scale-110",
              )}
            >
              <Icon className={cn("h-[18px] w-[18px]", active && "drop-shadow-sm")} />
            </div>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
