import "server-only";

import type { Anime } from "@/lib/anilist/types";

type JikanAnime = {
  synopsis?: string | null;
  score?: number | null;
  episodes?: number | null;
  duration?: string | null;
  status?: string | null;
  source?: string | null;
  season?: string | null;
  year?: number | null;
  genres?: { name?: string }[];
  studios?: { name?: string }[];
  images?: { jpg?: { large_image_url?: string | null; image_url?: string | null } };
};

function durationMinutes(value?: string | null) {
  if (!value) return null;
  const hours = Number(value.match(/(\d+)\s*hr/)?.[1] || 0);
  const minutes = Number(value.match(/(\d+)\s*min/)?.[1] || 0);
  return hours || minutes ? hours * 60 + minutes : null;
}

function status(value?: string | null) {
  if (value === "Currently Airing") return "RELEASING";
  if (value === "Finished Airing") return "FINISHED";
  if (value === "Not yet aired") return "NOT_YET_RELEASED";
  return null;
}

export async function getJikanAnime(malId: number): Promise<Partial<Anime> | null> {
  if (!Number.isInteger(malId) || malId < 1) return null;
  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime/${malId}/full`, {
      headers: { Accept: "application/json", "User-Agent": "Anme/1.0" },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const raw = (await response.json() as { data?: JikanAnime }).data;
    if (!raw) return null;
    return {
      description: raw.synopsis || null,
      score: typeof raw.score === "number" ? Math.round(raw.score * 10) : null,
      episodes: raw.episodes || null,
      duration: durationMinutes(raw.duration),
      status: status(raw.status),
      source: raw.source || null,
      season: raw.season?.toUpperCase() || null,
      seasonYear: raw.year || null,
      genres: (raw.genres || []).map((genre) => genre.name).filter((name): name is string => Boolean(name)),
      studios: (raw.studios || []).map((studio) => studio.name).filter((name): name is string => Boolean(name)),
      coverImage: raw.images?.jpg?.large_image_url || raw.images?.jpg?.image_url || undefined,
    };
  } catch {
    return null;
  }
}
