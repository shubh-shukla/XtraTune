import "server-only";

const BASE_URL = process.env.SCRAPER_URL;
if (!BASE_URL) throw new Error("No scraper url provided");

/**
 * Lightweight fetch wrapper that mirrors the axios instance interface
 * used throughout the codebase (`music.get(path)` → `{ data }`).
 */
const music = {
  async get(path: string) {
    const res = await fetch(`${BASE_URL}${path}`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`music.get ${path} failed: ${res.status}`);
    const data = await res.json();
    return { data };
  },
};

export { music };
