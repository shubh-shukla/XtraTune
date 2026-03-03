"use client";

import { Search, X, Music2, Disc3, Mic2, ListMusic, TrendingUp } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SuggestionItem = {
  id: string;
  title: string;
  type: string;
  image: string;
  description: string;
};

type CategorizedResults = {
  topResult: SuggestionItem[];
  albums: SuggestionItem[];
  songs: SuggestionItem[];
  artists: SuggestionItem[];
  playlists: SuggestionItem[];
};

type RecentSearch = SuggestionItem & { timestamp: number };

/* ------------------------------------------------------------------ */
/*  Recent-searches helpers (localStorage)                             */
/* ------------------------------------------------------------------ */

const RECENT_KEY = "xt_recent_searches";
const MAX_RECENT = 5;

function getRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentSearch(item: SuggestionItem) {
  const recent = getRecentSearches().filter((r) => r.id !== item.id);
  recent.unshift({ ...item, timestamp: Date.now() });
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function removeRecentSearch(id: string) {
  const recent = getRecentSearches().filter((r) => r.id !== id);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
}

/* ------------------------------------------------------------------ */
/*  Type icons & labels                                                */
/* ------------------------------------------------------------------ */

const typeIconMap: Record<string, React.ReactNode> = {
  song: <Music2 className="h-3.5 w-3.5" />,
  album: <Disc3 className="h-3.5 w-3.5" />,
  artist: <Mic2 className="h-3.5 w-3.5" />,
  playlist: <ListMusic className="h-3.5 w-3.5" />,
};

const typeLabel: Record<string, string> = {
  song: "Song",
  album: "Album",
  artist: "Artist",
  playlist: "Playlist",
};

/* ------------------------------------------------------------------ */
/*  Item row (shared between trending / recent / results)              */
/* ------------------------------------------------------------------ */

function ItemRow({
  item,
  onClick,
  trailing,
}: {
  item: SuggestionItem;
  onClick: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent/50 active:scale-[0.98] group"
    >
      {item.image ? (
        <Image
          src={item.image}
          alt=""
          width={48}
          height={48}
          className="h-11 w-11 rounded-md object-cover shrink-0"
          unoptimized
        />
      ) : (
        <div className="h-11 w-11 rounded-md bg-muted grid place-items-center shrink-0 text-muted-foreground">
          {typeIconMap[item.type] ?? <Music2 className="h-4 w-4" />}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate leading-tight">{item.title}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {item.description || typeLabel[item.type] || item.type}
        </p>
      </div>
      {trailing}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Section header + item list                                         */
/* ------------------------------------------------------------------ */

function Section({
  title,
  items,
  onSelect,
  onViewAll,
}: {
  title: string;
  items: SuggestionItem[];
  onSelect: (item: SuggestionItem) => void;
  onViewAll?: () => void;
}) {
  if (!items.length) return null;
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between mb-1 px-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {onViewAll && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewAll();
            }}
            className="text-[11px] font-medium text-primary hover:underline rounded-full border border-border/60 px-2.5 py-0.5"
          >
            View All
          </button>
        )}
      </div>
      <div className="space-y-0.5">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} onClick={() => onSelect(item)} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty panel (trending + recent searches)                           */
/* ------------------------------------------------------------------ */

function EmptyPanel({
  trending,
  recentSearches,
  onSelectItem,
  onRemoveRecent,
}: {
  trending: SuggestionItem[];
  recentSearches: RecentSearch[];
  onSelectItem: (item: SuggestionItem) => void;
  onRemoveRecent: (id: string) => void;
}) {
  const hasTrending = trending.length > 0;
  const hasRecent = recentSearches.length > 0;

  if (!hasTrending && !hasRecent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="h-10 w-10 text-muted-foreground/20 mb-3" />
        <p className="text-sm text-muted-foreground">
          Start typing to search songs, albums & artists
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-6",
        hasRecent ? "grid-cols-1 lg:grid-cols-[1fr_260px]" : "grid-cols-1",
      )}
    >
      {/* Trending */}
      {hasTrending && (
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-2 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Trending
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-4">
            {trending.map((item) => (
              <ItemRow key={item.id} item={item} onClick={() => onSelectItem(item)} />
            ))}
          </div>
        </div>
      )}

      {/* Recent searches */}
      {hasRecent && (
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-2">
            Recent Searches
          </h3>
          <div className="space-y-0.5">
            {recentSearches.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onClick={() => onSelectItem(item)}
                trailing={
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRecent(item.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-muted shrink-0"
                    aria-label="Remove"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Results panel (categorized columns like JioSaavn)                  */
/* ------------------------------------------------------------------ */

function ResultsPanel({
  results,
  onSelect,
  onViewAll,
}: {
  results: CategorizedResults;
  onSelect: (item: SuggestionItem) => void;
  onViewAll: () => void;
}) {
  const total =
    results.topResult.length +
    results.albums.length +
    results.songs.length +
    results.artists.length +
    results.playlists.length;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Music2 className="h-10 w-10 text-muted-foreground/20 mb-3" />
        <p className="text-sm text-muted-foreground">No results found</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top row: up to 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Section title="Top Result" items={results.topResult} onSelect={onSelect} />
        <Section title="Albums" items={results.albums} onSelect={onSelect} onViewAll={onViewAll} />
        <Section title="Songs" items={results.songs} onSelect={onSelect} onViewAll={onViewAll} />
        <Section
          title="Artists"
          items={results.artists}
          onSelect={onSelect}
          onViewAll={onViewAll}
        />
      </div>

      {/* Bottom row: playlists */}
      {results.playlists.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Section
            title="Playlists"
            items={results.playlists}
            onSelect={onSelect}
            onViewAll={onViewAll}
          />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SearchBox (main export)                                            */
/* ------------------------------------------------------------------ */

export function SearchBox({ className }: { className?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CategorizedResults | null>(null);
  const [trending, setTrending] = useState<SuggestionItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  /* ── Load recent searches when overlay opens ─────────────── */
  useEffect(() => {
    if (isOpen) setRecentSearches(getRecentSearches());
  }, [isOpen]);

  /* ── Fetch trending once on first open ───────────────────── */
  const trendingFetched = useRef(false);
  useEffect(() => {
    if (!isOpen || trendingFetched.current) return;
    trendingFetched.current = true;
    fetch("/api/search/trending")
      .then((r) => r.json())
      .then((d) => setTrending(d.trending ?? []))
      .catch(() => {});
  }, [isOpen]);

  /* ── Debounced search ────────────────────────────────────── */
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      fetch(`/api/search/suggestions?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((data) => {
          setResults(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  /* ── Open / close helpers ────────────────────────────────── */
  const open = useCallback(() => {
    setIsOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => inputRef.current?.focus()));
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setResults(null);
  }, []);

  /* ── Navigation helpers ──────────────────────────────────── */
  const goSearch = useCallback(
    (q: string) => {
      const encoded = q.trim().replace(/\s+/g, "+");
      if (!encoded) return;
      close();
      router.push(`/search/${encoded}`);
    },
    [router, close],
  );

  const goItem = useCallback(
    (item: SuggestionItem) => {
      saveRecentSearch(item);
      close();
      if (item.type === "album") {
        router.push(`/album/${item.id}`);
      } else if (item.type === "artist") {
        router.push(`/album/artists/${item.id}`);
      } else {
        router.push(`/search/${item.title.trim().replace(/\s+/g, "+")}`);
      }
    },
    [router, close],
  );

  /* ── Keyboard ────────────────────────────────────────────── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      goSearch(query);
    } else if (e.key === "Escape") {
      close();
    }
  };

  /* ── Remove recent ───────────────────────────────────────── */
  const handleRemoveRecent = useCallback((id: string) => {
    removeRecentSearch(id);
    setRecentSearches(getRecentSearches());
  }, []);

  /* Determine which panel to show */
  const showResults = query.trim().length >= 2 && results !== null;

  return (
    <>
      {/* ── Compact trigger (visible when overlay is closed) ── */}
      <div className={cn("relative", className)}>
        <button
          type="button"
          onClick={open}
          className="flex items-center justify-center gap-2.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm text-muted-foreground shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 w-full max-w-md mx-auto cursor-text"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="font-medium">Search</span>
        </button>
      </div>

      {/* ── Full-screen search overlay ─────────────────────── */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex flex-col">
          {/* Semi-transparent backdrop */}
          <div
            className="absolute inset-0 bg-black/25 animate-in fade-in duration-150"
            onClick={close}
          />

          {/* Search panel */}
          <div className="relative mx-auto w-full max-w-5xl mt-2 sm:mt-4 px-3 sm:px-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-background rounded-2xl shadow-2xl border border-border/50 overflow-hidden flex flex-col max-h-[85vh]">
              {/* ── Input row ── */}
              <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-border/40 shrink-0">
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search songs, albums, artists…"
                  className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/50 font-medium"
                  autoComplete="off"
                  spellCheck={false}
                />
                {loading && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary shrink-0" />
                )}
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setResults(null);
                      inputRef.current?.focus();
                    }}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 mr-1"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={close}
                  className="h-8 w-8 grid place-items-center rounded-full bg-muted/60 hover:bg-muted transition-colors shrink-0"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* ── Scrollable content ── */}
              <div className="overflow-y-auto overscroll-contain px-3 sm:px-4 py-4 sm:py-5">
                {showResults ? (
                  loading && !results?.topResult?.length && !results?.songs?.length ? (
                    /* Skeleton loaders while initial results come in */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-3">
                          <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                          {[1, 2, 3].map((j) => (
                            <div key={j} className="flex items-center gap-3">
                              <div className="h-11 w-11 rounded-md bg-muted animate-pulse shrink-0" />
                              <div className="flex-1 space-y-1.5">
                                <div className="h-3 w-28 bg-muted rounded animate-pulse" />
                                <div className="h-2.5 w-20 bg-muted rounded animate-pulse" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ResultsPanel
                      results={results!}
                      onSelect={goItem}
                      onViewAll={() => goSearch(query)}
                    />
                  )
                ) : query.trim().length >= 2 && !loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Music2 className="h-10 w-10 text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No results for &ldquo;{query.trim()}&rdquo;
                    </p>
                  </div>
                ) : (
                  <EmptyPanel
                    trending={trending}
                    recentSearches={recentSearches}
                    onSelectItem={goItem}
                    onRemoveRecent={handleRemoveRecent}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
