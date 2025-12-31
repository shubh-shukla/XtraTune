import { AlbumCard } from "@/components/album-card";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { music } from "@/lib/music";
import { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Artists | XtraTune",
    description: "Discover trending voices, legends, and rising artists across every vibe.",
};

type ArtistPreview = {
    id: string;
    name: string;
    image: { link: string }[];
    url: string;
    type: string;
    blurb?: string;
};

const normalizeImage = (image?: { link?: string; url?: string }[]) => {
    if (!image || image.length === 0) return [{ link: "/song-placeholder.webp" }];
    return image.map((img) => ({ link: img?.link ?? img?.url ?? "/song-placeholder.webp" }));
};

async function fetchArtists(query: string, limit = 12): Promise<ArtistPreview[]> {
    try {
        const { data } = await music.get(
            `/search?query=${encodeURIComponent(query)}&page=0&limit=${limit}`
        );
        const artists = data?.data?.artists?.results ?? [];

        return artists.slice(0, limit).map((artist: any, index: number) => ({
            id: artist.id ?? `${query}-${index}`,
            name: artist.title ?? artist.name ?? "Unknown Artist",
            image: normalizeImage(artist.image),
            url: artist.url ?? "",
            type: artist.type ?? "artist",
            blurb: artist.description ?? "",
        }));
    } catch (error) {
        console.log("Failed to fetch artists", query, error);
        return [];
    }
}

const collections = [
    {
        key: "spotlight",
        title: "Spotlight Artists",
        query: "top artists",
        blurb: "Most searched voices right now.",
        badge: "Realtime",
        limit: 12,
    },
    {
        key: "bollywood",
        title: "Bollywood Icons",
        query: "bollywood singers",
        blurb: "Voices that defined Hindi cinema.",
        badge: "Classics",
        limit: 12,
    },
    {
        key: "indie",
        title: "Indie & Alt",
        query: "indie artists",
        blurb: "Fresh sounds from the indie circuit.",
        badge: "Fresh",
        limit: 12,
    },
    {
        key: "punjabi",
        title: "Punjabi Hitmakers",
        query: "punjabi singer",
        blurb: "Uptempo bangers and viral voices.",
        badge: "High energy",
        limit: 12,
    },
    {
        key: "legends",
        title: "Timeless Legends",
        query: "evergreen singers",
        blurb: "Golden era greats to replay forever.",
        badge: "Legacy",
        limit: 12,
    },
];

export default async function ArtistsPage() {
    const sections = await Promise.all(
        collections.map(async (collection) => ({
            ...collection,
            artists: await fetchArtists(collection.query, collection.limit),
        }))
    );

    const spotlight = sections.find((s) => s.key === "spotlight")?.artists ?? [];
    const heroPicks = spotlight.slice(0, 3);

    return (
        <main className="space-y-12 px-4 lg:px-8 py-6">
            <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-rose-500/15 via-orange-400/15 to-amber-300/15 p-6 sm:p-10 shadow-lg">
                <div
                    className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_45%)] dark:bg-[radial-gradient(circle_at_top_left,#ffffff22,transparent_40%)]"
                    aria-hidden
                />
                <div className="relative grid gap-6 lg:grid-cols-[2fr,1fr] lg:items-center">
                    <div className="space-y-5">
                        <div className="inline-flex items-center gap-2 rounded-full bg-secondary/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" /> On air now
                        </div>
                        <h1 className="font-cal text-4xl sm:text-5xl lg:text-6xl text-foreground leading-tight">
                            Meet the voices driving every playlist.
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl">
                            Explore charting singers, timeless legends, and indie discoveries. Tap an artist to open their page and start a personalized queue instantly.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/search/Top%20Artists"
                                className={buttonVariants({ className: "gap-2 bg-primary text-primary-foreground hover:bg-primary/90" })}
                            >
                                Browse top artists
                            </Link>
                            <Link
                                href="/search/Arijit%20Singh"
                                className={buttonVariants({ variant: "ghost", className: "gap-2 text-foreground hover:bg-foreground/10 dark:hover:bg-white/10" })}
                            >
                                Quick search: Arijit Singh
                            </Link>
                        </div>
                        <div className="flex flex-wrap gap-3 text-muted-foreground text-sm">
                            <span className="rounded-full border border-border px-3 py-1 bg-secondary/70">Verified & trending</span>
                            <span className="rounded-full border border-border px-3 py-1 bg-secondary/70">One-tap artist pages</span>
                            <span className="rounded-full border border-border px-3 py-1 bg-secondary/70">Likes sync everywhere</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 self-stretch">
                        {heroPicks.length === 0 && (
                            <div className="rounded-2xl border border-border bg-card/80 px-4 py-5 text-foreground shadow-inner backdrop-blur">
                                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Stay tuned</p>
                                <p className="font-semibold text-lg">Artists loading</p>
                                <p className="text-xs text-muted-foreground mt-1">We are fetching top voices.</p>
                            </div>
                        )}
                        {heroPicks.map((artist) => (
                            <div
                                key={artist.id}
                                className="rounded-2xl border border-border bg-card/80 px-4 py-5 text-foreground shadow-inner backdrop-blur"
                            >
                                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Artist</p>
                                <p className="font-semibold text-lg line-clamp-1">{artist.name.split("(")[0].replace("&#039;", "'")}</p>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{artist.blurb || "Tap to open the artist page"}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {sections.map((section) => (
                <section key={section.key} className="space-y-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{section.badge}</p>
                            <h2 className="font-cal text-3xl text-foreground">{section.title}</h2>
                            <p className="text-muted-foreground text-sm max-w-2xl">{section.blurb}</p>
                        </div>
                        <Link
                            href={`/search/${encodeURIComponent(section.query)}`}
                            className="text-sm text-orange-500 hover:text-orange-400 font-semibold"
                        >
                            Open search for {section.query}
                        </Link>
                    </div>
                    <Separator />
                    {section.artists.length === 0 ? (
                        <p className="text-muted-foreground">No artists found right now. Try the search above.</p>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                            {section.artists.map((artist) => (
                                <AlbumCard
                                    key={artist.id}
                                    id={artist.id}
                                    imageURL={normalizeImage(artist.image)}
                                    title={artist.name}
                                    type={artist.type ?? "artist"}
                                    url={artist.url}
                                    aspectRatio="square"
                                    width={220}
                                    height={220}
                                    className="w-full"
                                />
                            ))}
                        </div>
                    )}
                </section>
            ))}
        </main>
    );
}