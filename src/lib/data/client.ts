import type { Anime } from "@/lib/anilist/types";

export async function fetchAnimeDetails(id: number): Promise<Anime | null> {
  try {
    const response = await fetch(`/api/anime/details?id=${id}`);
    if (!response.ok) return null;
    return (await response.json() as { anime?: Anime }).anime || null;
  } catch {
    return null;
  }
}
