"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function HorizontalScroll({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const check = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 2);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    check();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", check);
      ro.disconnect();
    };
  }, [check]);

  const scroll = (direction: "left" | "right") => {
    const el = ref.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="group/scroll relative">
      {/* left fade + arrow button */}
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-10 flex w-12 items-center justify-start transition-opacity duration-300",
          showLeft ? "opacity-100" : "opacity-0",
        )}
        style={{
          background:
            "linear-gradient(to right, hsl(var(--background)) 0%, hsl(var(--background) / 0.85) 40%, transparent 100%)",
        }}
      >
        <button
          aria-label="Scroll left"
          tabIndex={-1}
          onClick={() => scroll("left")}
          className="pointer-events-auto ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-muted/80 text-foreground shadow-md backdrop-blur-sm opacity-0 transition-opacity group-hover/scroll:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* right fade + arrow button */}
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-10 flex w-12 items-center justify-end transition-opacity duration-300",
          showRight ? "opacity-100" : "opacity-0",
        )}
        style={{
          background:
            "linear-gradient(to left, hsl(var(--background)) 0%, hsl(var(--background) / 0.85) 40%, transparent 100%)",
        }}
      >
        <button
          aria-label="Scroll right"
          tabIndex={-1}
          onClick={() => scroll("right")}
          className="pointer-events-auto mr-1 flex h-8 w-8 items-center justify-center rounded-full bg-muted/80 text-foreground shadow-md backdrop-blur-sm opacity-0 transition-opacity group-hover/scroll:opacity-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div ref={ref} className={cn("no-scrollbar overflow-x-auto", className)}>
        {children}
      </div>
    </div>
  );
}
