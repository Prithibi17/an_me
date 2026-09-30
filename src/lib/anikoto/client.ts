import "server-only";

const BASE_URL = process.env.ANIKOTO_API_URL || "https://anikotoapi.site";
const CATALOG_PAGES = 8;
const PER_PAGE = 100;

type CatalogRow = {
  id: number;
  ani_id?: string | number | null;
};

type EpisodeRow = {
  number: number;
  title?: string;
  jp_title?: string;
  embed_url?: { sub?: string; dub?: string };
};

type CatalogResponse = { ok: boolean; data?: CatalogRow[] };
type SeriesResponse = { ok: boolean; data?: { episodes?: EpisodeRow[] } };

export type AnikotoEpisodeSource = {
  provider: "anikoto";
  serverName: "Server 3";
  episode: number;
  title: string;
  subUrl: string | null;
  dubUrl: string | null;
};

let catalogCache: { expiresAt: number; byAniListId: Map<number, number> } | null = null;

async function fetchJson<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: { Accept: "application/json", "User-Agent": "Anme/1.0" },
      next: { revalidate },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

async function getCatalogMap() {
  if (catalogCache && catalogCache.expiresAt > Date.now()) return catalogCache.byAniListId;

  const responses = await Promise.all(
    Array.from({ length: CATALOG_PAGES }, (_, index) =>
      fetchJson<CatalogResponse>(`/recent-anime?page=${index + 1}&per_page=${PER_PAGE}`, 21600)
    )
  );
  const byAniListId = new Map<number, number>();
  for (const response of responses) {
    for (const row of response?.data || []) {
      const aniListId = Number(row.ani_id);
      if (Number.isInteger(aniListId) && aniListId > 0 && Number.isInteger(row.id)) {
        byAniListId.set(aniListId, row.id);
      }
    }
  }
  catalogCache = { expiresAt: Date.now() + 6 * 60 * 60 * 1000, byAniListId };
  return byAniListId;
}

function trustedEmbedUrl(value: unknown, track: "sub" | "dub") {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "megaplay.buzz") return null;
    if (!new RegExp(`^/stream/s-2/\\d+/${track}$`).test(url.pathname)) return null;
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export async function getAnikotoEpisodeSource(aniListId: number, episode: number) {
  if (!Number.isInteger(aniListId) || aniListId < 1 || !Number.isInteger(episode) || episode < 1) return null;
  const internalId = (await getCatalogMap()).get(aniListId);
  if (!internalId) return null;

  const series = await fetchJson<SeriesResponse>(`/series/${internalId}`, 1800);
  const row = series?.data?.episodes?.find((item) => Number(item.number) === episode);
  if (!row) return null;

  const subUrl = trustedEmbedUrl(row.embed_url?.sub, "sub");
  const dubUrl = trustedEmbedUrl(row.embed_url?.dub, "dub");
  if (!subUrl && !dubUrl) return null;
  return {
    provider: "anikoto",
    serverName: "Server 3",
    episode,
    title: row.title || row.jp_title || `Episode ${episode}`,
    subUrl,
    dubUrl,
  } satisfies AnikotoEpisodeSource;
}
