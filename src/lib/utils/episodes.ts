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

  const sub = typeof anime.subEpisodeCount === "number" ? anime.subEpisodeCount : released;
  // Never infer DUB from SUB. A missing provider count means no confirmed dub.
  const dub = typeof anime.dubEpisodeCount === "number" ? anime.dubEpisodeCount : 0;
  return { sub, dub, total };
}
