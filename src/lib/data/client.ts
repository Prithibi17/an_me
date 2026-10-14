import type { Anime } from "@/lib/anilist/types";

const CACHE_TTL = 5 * 60 * 1000;
const animeCache = new Map<string, { anime: Anime; expiresAt: number }>();
const pendingRequests = new Map<string, Promise<Anime | null>>();

export async function fetchAnimeDetails(
  id: number,
  options: { core?: boolean; includeEpisodeStills?: boolean } = {},
): Promise<Anime | null> {
  const key = `${id}:${options.core ? "core" : options.includeEpisodeStills === false ? "details" : "full"}`;
  const cached = animeCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.anime;
  const pending = pendingRequests.get(key);
  if (pending) return pending;

  const request = (async () => {
    try {
      const params = new URLSearchParams({ id: String(id) });
      if (options.core) params.set("core", "1");
      if (options.includeEpisodeStills === false) params.set("episodeStills", "0");
      const response = await fetch(`/api/anime/details?${params}`);
      if (!response.ok) return null;
      const anime = (await response.json() as { anime?: Anime }).anime || null;
      if (anime) animeCache.set(key, { anime, expiresAt: Date.now() + CACHE_TTL });
      return anime;
    } catch {
      return null;
    } finally {
      pendingRequests.delete(key);
    }
  })();
  pendingRequests.set(key, request);
  return request;
}
