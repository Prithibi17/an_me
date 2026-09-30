import type { Anime } from "@/lib/anilist/types";

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
