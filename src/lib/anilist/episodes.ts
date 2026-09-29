import { StreamingEpisode } from "./types";
import { EpisodeItem } from "../providers/playback-provider";

export async function getRealEpisodes(
  animeTitle: string,
  totalEpisodes?: number | null,
  streamingEpisodes?: StreamingEpisode[],
  bannerFallback?: string | null,
  coverFallback?: string | null,
  status?: string | null,
  latestAiredEpisode?: number | null
): Promise<EpisodeItem[]> {
  // If the anime has not yet aired or 0 episodes have aired, NEVER invent fake episodes
  if (status === "NOT_YET_RELEASED" || latestAiredEpisode === 0) {
    return [];
  }

  // Determine the maximum officially released episode number
  let maxAired: number | null = null;
  if (typeof latestAiredEpisode === "number" && latestAiredEpisode > 0) {
    maxAired = latestAiredEpisode;
  } else if (status === "FINISHED" && totalEpisodes && totalEpisodes > 0) {
    maxAired = totalEpisodes;
  }

  const episodesMap = new Map<number, EpisodeItem>();

  // 1. Parse real streaming episodes from AniList (Crunchyroll, etc.)
  if (streamingEpisodes && streamingEpisodes.length > 0) {
    for (const ep of streamingEpisodes) {
      if (!ep.title) continue;

      // Match "Episode 1 - Title" or "Episode 1: Title" or "Episode 1"
      const match = ep.title.match(/Episode\s+(\d+)(?:\s*[-:]\s*(.+))?/i);
      if (match) {
        const epNum = parseInt(match[1], 10);
        if (!isNaN(epNum) && epNum > 0 && (maxAired === null || epNum <= maxAired)) {
          const rawTitle = match[2]?.trim();
          episodesMap.set(epNum, {
            number: epNum,
            title: rawTitle && rawTitle.length > 0 ? rawTitle : "Episode " + epNum,
            // Keep this empty when AniList has no episode-specific still so the UI
            // can clearly distinguish real thumbnails from its visual fallback.
            thumbnail: ep.thumbnail || undefined,
            duration: 24,
          });
        }
      }
    }
  }

  // 2. If we need more real episode titles, query Kitsu canonical episode database
  const targetCount = maxAired !== null ? maxAired : episodesMap.size;
  if (targetCount > 0 && episodesMap.size < targetCount) {
    try {
      const cleanTitle = animeTitle.replace(/\s*Season\s*\d+/i, "").replace(/:\s*Season\s*\d+/i, "").trim();
      const searchRes = await fetch(
        "https://kitsu.io/api/edge/anime?filter[text]=" + encodeURIComponent(cleanTitle) + "&page[limit]=1",
        { next: { revalidate: 86400 } }
      );

      if (searchRes.ok) {
        const searchJson = await searchRes.json();
        const kitsuAnime = searchJson.data?.[0];

        if (kitsuAnime?.id) {
          // Kitsu caps episode pages at 20. Fetch all confirmed episodes in
          // pages so episode-specific stills are not lost after episode 20.
          const pageSize = 20;
          for (let offset = 0; offset < targetCount; offset += pageSize) {
            const epRes = await fetch(
              "https://kitsu.io/api/edge/episodes?filter[mediaId]=" + kitsuAnime.id + `&page[limit]=${pageSize}&page[offset]=${offset}&sort=number`,
              { next: { revalidate: 86400 } }
            );
            if (!epRes.ok) break;
            const epJson = await epRes.json();
            if (!Array.isArray(epJson.data) || epJson.data.length === 0) break;
            for (const item of epJson.data) {
                const num = item.attributes?.number;
                const canonicalTitle = item.attributes?.canonicalTitle;
                const thumb =
                  item.attributes?.thumbnail?.original ||
                  item.attributes?.thumbnail?.large ||
                  item.attributes?.thumbnail?.medium;

                if (num && !isNaN(num) && num > 0 && (maxAired === null || num <= maxAired)) {
                  const existing = episodesMap.get(num);
                  episodesMap.set(num, {
                    number: num,
                    title: canonicalTitle || existing?.title || "Episode " + num,
                    thumbnail: thumb || existing?.thumbnail || undefined,
                    duration: item.attributes?.length || 24,
                  });
                }
            }
          }
        }
      }
    } catch (err) {
      console.error("Kitsu episodes lookup failed:", err);
    }
  }

  // 3. For any remaining missing episodes up to targetCount, assign clean Episode {num}
  if (targetCount > 0) {
    for (let i = 1; i <= targetCount; i++) {
      if (!episodesMap.has(i)) {
        episodesMap.set(i, {
          number: i,
          title: "Episode " + i,
          thumbnail: undefined,
          duration: 24,
        });
      }
    }
  }

  // Convert to sorted array
  return Array.from(episodesMap.values()).sort((a, b) => a.number - b.number);
}
