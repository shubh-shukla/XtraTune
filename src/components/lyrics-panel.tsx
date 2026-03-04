"use client";

import { Mic2, X, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface LyricsPanelProps {
  songId: string;
  songTitle: string;
  artist: string;
}

export const LyricsPanel = ({ songId, songTitle, artist }: LyricsPanelProps) => {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lyrics, setLyrics] = useState("");
  const [hasLyrics, setHasLyrics] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [copyright, setCopyright] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const prevSongId = useRef("");

  // Fetch lyrics when song changes or panel is opened
  useEffect(() => {
    if (!songId) return;

    // Reset on new song
    if (prevSongId.current !== songId) {
      prevSongId.current = songId;
      setLyrics("");
      setHasLyrics(null);
      setCopyright("");

      // If panel was open, fetch new lyrics
      if (open) {
        fetchLyrics();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songId]);

  useEffect(() => {
    if (open && songId && hasLyrics === null) {
      fetchLyrics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fetchLyrics = async () => {
    if (!songId || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lyrics?id=${songId}`);
      const data = await res.json();
      setLyrics(data.lyrics || "");
      setHasLyrics(!!data.hasLyrics);
      setCopyright(data.copyright || "");
    } catch {
      setHasLyrics(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleOpen = () => {
    setOpen(!open);
    setExpanded(false);
  };

  // Don't render button until we know if lyrics exist (after first fetch)
  // We'll show a small lyrics button anyway so user can try
  return (
    <>
      {/* Trigger button - sits in the player controls */}
      <button
        type="button"
        onClick={toggleOpen}
        className={cn(
          "hidden sm:grid h-9 w-9 place-items-center rounded-full transition-all",
          open
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:text-foreground hover:bg-muted",
          hasLyrics === false && "opacity-40",
        )}
        aria-label="Toggle lyrics"
        title={hasLyrics === false ? "No lyrics available" : "Show lyrics"}
      >
        <Mic2 className="h-4 w-4" />
      </button>

      {/* Lyrics panel - slides up above the player */}
      {open && (
        <div
          ref={panelRef}
          className={cn(
            "fixed z-[55] left-0 right-0 transition-all duration-300 ease-out",
            expanded ? "top-0 bottom-[70px]" : "bottom-[70px] max-h-[45vh]",
          )}
        >
          {/* Backdrop for expanded mode */}
          {expanded && (
            <div className="absolute inset-0 bg-black/30" onClick={() => setExpanded(false)} />
          )}

          <div
            className={cn(
              "relative bg-background/95 backdrop-blur-xl border-t border-border shadow-2xl flex flex-col",
              expanded ? "h-full" : "h-full max-h-[45vh]",
              "animate-in slide-in-from-bottom-4 duration-300",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                  <Mic2 className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{songTitle}</p>
                  <p className="text-xs text-muted-foreground truncate">{artist}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted transition-colors"
                  aria-label={expanded ? "Collapse" : "Expand"}
                >
                  {expanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={toggleOpen}
                  className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted transition-colors"
                  aria-label="Close lyrics"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-32 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Fetching lyrics…</p>
                </div>
              ) : !hasLyrics ? (
                <div className="flex flex-col items-center justify-center h-32 gap-3 text-center">
                  <Mic2 className="h-10 w-10 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">No lyrics available for this song</p>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto">
                  <div className="whitespace-pre-wrap text-base sm:text-lg leading-relaxed font-medium text-foreground/90">
                    {lyrics}
                  </div>
                  {copyright && (
                    <p className="mt-6 text-[11px] text-muted-foreground/50 text-center">
                      {copyright}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
