import "server-only";

const KUHI_BASE_URL = "https://anime-and-manwhua.vercel.app";

export type KuhiMangaSource = "vortex" | "toraka" | "mangadex" | "anilist";

export interface KuhiMangaChapter {
  id: string;
  number: string;
  title?: string | null;
  is_locked?: boolean;
  release_date?: string | null;
}

export interface KuhiMangaInfo {
  title: string;
  slug: string;
  source: KuhiMangaSource;
  poster?: string | null;
  description?: string | null;
  status?: string | null;
  type?: string | null;
  genres?: string[];
  total_chapters?: number;
  chapters?: KuhiMangaChapter[];
}

export interface KuhiChapterPage {
  url: string;
  index?: number;
}

export interface KuhiChapterResponse {
  title?: string | null;
  chapter?: string | number | null;
  pages?: Array<KuhiChapterPage | string>;
}

interface KuhiSearchResult {
  title: string;
  slug: string;
  source: KuhiMangaSource;
  type?: string | null;
}

function normalizeTitle(value: string) {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/^(the|a|an)\s+/, "");
}

async function kuhiFetch<T>(path: string, revalidate = 300): Promise<T | null> {
  const apiKey = process.env.KUHI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(`${KUHI_BASE_URL}${path}`, {
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
      next: { revalidate },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

export async function getKuhiAnimePlayer(animeId: number, episode: number, audio: "sub" | "dub") {
  const query = new URLSearchParams({ id: String(animeId), episode: String(episode), audio });
  return kuhiFetch<{ player_url?: string; skip_times?: unknown }>(`/api/anime/player?${query}`, 60);
}

export async function resolveKuhiManga(title: string, type?: string | null) {
  const requestedType = type?.toLocaleLowerCase();
  const sources: KuhiMangaSource[] = ["toraka", "vortex", "mangadex"];
  const responses = await Promise.all(sources.map((source) => {
    const query = new URLSearchParams({ q: title, type: requestedType || "all", source });
    return kuhiFetch<{ results?: KuhiSearchResult[] }>(`/api/manga/search?${query}`, 600);
  }));
  const results = responses.flatMap((data) => data?.results || []);
  const normalized = normalizeTitle(title);
  const sourceRank: Record<KuhiMangaSource, number> = { toraka: 0, vortex: 1, mangadex: 2, anilist: 3 };
  const matches = results
    .filter((item) => normalizeTitle(item.title) === normalized)
    .sort((a, b) => {
      const typeA = requestedType && itemType(a) === requestedType ? 0 : 1;
      const typeB = requestedType && itemType(b) === requestedType ? 0 : 1;
      return typeA - typeB || sourceRank[a.source] - sourceRank[b.source];
    });

  for (const match of matches) {
    const info = await getKuhiMangaInfo(match.slug, match.source);
    if (info?.chapters?.length) return { ...info, source: match.source, slug: match.slug };
  }
  return null;
}

function itemType(item: KuhiSearchResult) {
  return (item.type || "").toLocaleLowerCase();
}

export async function getKuhiMangaInfo(slug: string, source: KuhiMangaSource) {
  const query = new URLSearchParams({ source });
  return kuhiFetch<KuhiMangaInfo>(`/api/manga/info/${encodeURIComponent(slug)}?${query}`, 600);
}

export async function getKuhiChapter(chapterId: string, source: KuhiMangaSource) {
  const query = new URLSearchParams({ source });
  return kuhiFetch<KuhiChapterResponse>(`/api/manga/chapter/${encodeURIComponent(chapterId)}?${query}`, 300);
}

export function isKuhiMangaSource(value: string | undefined): value is KuhiMangaSource {
  return value === "vortex" || value === "toraka" || value === "mangadex" || value === "anilist";
}
