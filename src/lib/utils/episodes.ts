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

  // AniList does not publish a separate dub episode count. Until a provider
  // supplies one, use the known available episode boundary rather than the
  // planned total so upcoming titles never appear to have released episodes.
  return { sub: released, dub: released, total };
}
