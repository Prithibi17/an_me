import type { Anime } from "@/lib/anilist/types";

export interface EpisodeCounts {
  sub: number;
  dub: number;
  total: number | null;
}

export function getEpisodeCounts(anime: Anime): EpisodeCounts {
  const isUpcoming = anime.status === "NOT_YET_RELEASED";
  const total = typeof anime.episodes === "number" && anime.episodes > 0 ? anime.episodes : null;
  const released = isUpcoming
    ? 0
    : typeof anime.latestAiredEpisode === "number" && anime.latestAiredEpisode > 0
      ? anime.latestAiredEpisode
      : anime.status === "FINISHED" && total
        ? total
        : 0;

  // Provider catalogs can lag behind the verified release feed. Never show a
  // SUB count lower than the latest episode known to have aired.
  const providerSub = typeof anime.subEpisodeCount === "number" ? anime.subEpisodeCount : 0;
  const sub = Math.max(providerSub, released);
  // Never infer DUB from SUB. A missing provider count means no confirmed dub.
  const dub = typeof anime.dubEpisodeCount === "number" ? anime.dubEpisodeCount : 0;
  return { sub, dub, total };
}

export type EpisodeLanguage = "SUB" | "DUB" | "SUB & DUB";

export function matchesEpisodeLanguage(anime: Anime, language?: string | null) {
  if (!language || language === "All") return true;
  const counts = getEpisodeCounts(anime);
  if (language === "SUB") return counts.sub > 0;
  if (language === "DUB") return counts.dub > 0;
  if (language === "SUB & DUB") return counts.sub > 0 && counts.dub > 0;
  return true;
}
