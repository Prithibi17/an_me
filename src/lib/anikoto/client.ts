import "server-only";

const BASE_URL = process.env.ANIKOTO_API_URL || "https://anikotoapi.site";
const CATALOG_PAGES = 8;
const PER_PAGE = 100;

type CatalogRow = {
  id: number;
  ani_id?: string | number | null;
  is_sub?: string | number | null;
  is_dub?: string | number | null;
  episodes?: string | number | null;
  status?: string | null;
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

export type AnikotoAnimeMetadata = {
  provider: "Anikoto";
  episodes: number | null;
  latestAiredEpisode: number;
  dubbedEpisodes: number;
  status: "RELEASING" | "FINISHED";
};

let catalogCache: { expiresAt: number; byAniListId: Map<number, CatalogRow> } | null = null;

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
      fetchJson<CatalogResponse>(`/recent-anime?page=${index + 1}&per_page=${PER_PAGE}`, 300)
    )
  );
  const byAniListId = new Map<number, CatalogRow>();
  for (const response of responses) {
    for (const row of response?.data || []) {
      const aniListId = Number(row.ani_id);
      if (Number.isInteger(aniListId) && aniListId > 0 && Number.isInteger(row.id)) {
        byAniListId.set(aniListId, row);
      }
    }
  }
  catalogCache = { expiresAt: Date.now() + 5 * 60 * 1000, byAniListId };
  return byAniListId;
}

function positiveInteger(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

/** Availability evidence for a Chinese title, matched only by its exact AniList ID. */
export async function getAnikotoAnimeMetadata(aniListId: number): Promise<AnikotoAnimeMetadata | null> {
  if (!Number.isInteger(aniListId) || aniListId < 1) return null;
  const row = (await getCatalogMap()).get(aniListId);
  if (!row) return null;

  const latestAiredEpisode = positiveInteger(row.is_sub);
  if (!latestAiredEpisode) return null;
  const episodes = positiveInteger(row.episodes);
  const dubbedEpisodes = positiveInteger(row.is_dub) || 0;
  const finished = /finished|completed/i.test(row.status || "");
  return {
    provider: "Anikoto",
    episodes,
    latestAiredEpisode,
    dubbedEpisodes,
    status: finished ? "FINISHED" : "RELEASING",
  };
}

export async function enrichAnimeAvailability<T extends { id: number }>(items: T[]): Promise<T[]> {
  const catalog = await getCatalogMap();
  return items.map((item) => {
    const row = catalog.get(item.id);
    if (!row) return item;
    const subEpisodeCount = positiveInteger(row.is_sub) || 0;
    const dubEpisodeCount = positiveInteger(row.is_dub) || 0;
    return { ...item, subEpisodeCount, dubEpisodeCount };
  });
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
  const catalogRow = (await getCatalogMap()).get(aniListId);
  if (!catalogRow) return null;

  const series = await fetchJson<SeriesResponse>(`/series/${catalogRow.id}`, 1800);
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
