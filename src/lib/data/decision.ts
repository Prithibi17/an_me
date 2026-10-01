import type { Anime } from "@/lib/anilist/types";
import type { AnikotoAnimeMetadata } from "@/lib/anikoto/client";

function missing(value: unknown) {
  return value == null || value === "" || (Array.isArray(value) && value.length === 0);
}

/** AniList owns identity; Jikan may only fill fields AniList did not provide. */
export function mergeAnimeMetadata(primary: Anime, fallback: Partial<Anime> | null): Anime {
  if (!fallback) return { ...primary, dataSources: ["AniList"] };
  const merged = { ...primary } as Anime;
  const fillable: (keyof Anime)[] = [
    "description", "score", "episodes", "duration", "status", "source",
    "season", "seasonYear", "genres", "studios", "coverImage",
  ];
  for (const key of fillable) {
    if (missing(merged[key]) && !missing(fallback[key])) {
      (merged as unknown as Record<string, unknown>)[key] = fallback[key];
    }
  }
  merged.dataSources = ["AniList", "Jikan"];
  return merged;
}

/**
 * Episode availability is stronger evidence than a stale "not yet released"
 * label. Anikoto is admitted only after an exact AniList-ID match, so it may
 * correct release state without replacing AniList's identity or artwork.
 */
export function applyEpisodeAvailability(
  anime: Anime,
  availability: AnikotoAnimeMetadata | null,
): Anime {
  if (!availability || availability.latestAiredEpisode < 1) return anime;

  return {
    ...anime,
    episodes: anime.episodes || availability.episodes,
    status: availability.status,
    latestAiredEpisode: Math.max(anime.latestAiredEpisode || 0, availability.latestAiredEpisode),
    subEpisodeCount: availability.latestAiredEpisode,
    dubEpisodeCount: availability.dubbedEpisodes,
    dataSources: Array.from(new Set([...(anime.dataSources || ["AniList"]), availability.provider])),
  };
}
