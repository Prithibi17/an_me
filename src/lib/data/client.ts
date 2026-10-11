import type { Anime } from "@/lib/anilist/types";

export async function fetchAnimeDetails(id: number, options: { core?: boolean } = {}): Promise<Anime | null> {
  try {
    const response = await fetch(`/api/anime/details?id=${id}${options.core ? "&core=1" : ""}`);
    if (!response.ok) return null;
    return (await response.json() as { anime?: Anime }).anime || null;
  } catch {
    return null;
  }
}
