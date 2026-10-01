import {
  Anime,
  AnimePageResult,
  SearchFilterParams,
  AnimeSeason,
  AiringScheduleItem,
} from "./types";
import {
  TRENDING_QUERY,
  POPULAR_SEASON_QUERY,
  TOP_RATED_QUERY,
  SEARCH_QUERY,
  ANIME_DETAILS_QUERY,
  RECENTLY_AIRED_QUERY,
  AIRING_SCHEDULE_QUERY,
} from "./queries";
import { normalizeAnime } from "./normalize";
import { filterAnime, isAllowedAnime } from "./content-filter";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

async function anilistRequest<T>(query: string, variables: Record<string, any> = {}, retries = 2): Promise<T> {
  try {
    const res = await fetch(ANILIST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 300 },
    });

    if (res.status === 429 && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return anilistRequest<T>(query, variables, retries - 1);
    }

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      throw new Error("AniList request failed: " + res.status + " " + res.statusText + " " + errorBody);
    }

    const json = await res.json();
    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors[0].message || "GraphQL error");
    }

    return json.data;
  } catch (err) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return anilistRequest<T>(query, variables, retries - 1);
    }
    throw err;
  }
}

export function getCurrentSeason(): { season: AnimeSeason; year: number } {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  let season: AnimeSeason = "WINTER";
  if (month >= 3 && month <= 5) season = "SPRING";
  else if (month >= 6 && month <= 8) season = "SUMMER";
  else if (month >= 9 && month <= 11) season = "FALL";
  else season = "WINTER";

  return { season, year };
}

export async function getTrendingAnime(page = 1, perPage = 10): Promise<Anime[]> {
  try {
    const data = await anilistRequest<{ Page: { media: any[] } }>(TRENDING_QUERY, { page, perPage });
    return filterAnime((data.Page.media || []).map((m, idx) => normalizeAnime(m, idx + 1)));
  } catch (err) {
    console.error("Failed to fetch trending anime:", err);
    return [];
  }
}

export async function getPopularSeasonAnime(page = 1, perPage = 10): Promise<Anime[]> {
  try {
    const { season, year } = getCurrentSeason();
    const data = await anilistRequest<{ Page: { media: any[] } }>(POPULAR_SEASON_QUERY, {
      page,
      perPage,
      season,
      seasonYear: year,
    });
    return filterAnime((data.Page.media || []).map((m, idx) => normalizeAnime(m, idx + 1)));
  } catch (err) {
    console.error("Failed to fetch popular this season:", err);
    return [];
  }
}

export async function getTopRatedAnime(page = 1, perPage = 10): Promise<Anime[]> {
  try {
    const data = await anilistRequest<{ Page: { media: any[] } }>(TOP_RATED_QUERY, { page, perPage });
    return filterAnime((data.Page.media || []).map((m, idx) => normalizeAnime(m, idx + 1)));
  } catch (err) {
    console.error("Failed to fetch top rated anime:", err);
    return [];
  }
}

export async function getRecentlyAiredAnimePage(page = 1, perPage = 18): Promise<AnimePageResult> {
  try {
    // A five-minute boundary keeps Next's fetch cache useful instead of making
    // every request unique by including the current second in the cache key.
    const now = Math.floor(Date.now() / 300_000) * 300;
    const targetEnd = page * perPage;
    const uniqueAnime: Anime[] = [];
    const seenMediaIds = new Set<number>();
    let sourceTotal = 0;
    let sourceLastPage = Number.MAX_SAFE_INTEGER;
    let sourceEventsRead = 0;
    let apiPage = 1;

    // AniList pages airing events, not anime. Build one stable, globally
    // deduplicated stream first so an anime cannot move onto multiple UI pages.
    while (uniqueAnime.length < targetEnd + perPage && apiPage <= sourceLastPage) {
      const pages = Array.from(
        { length: Math.min(4, sourceLastPage - apiPage + 1) },
        (_, index) => apiPage + index,
      );
      const results = await Promise.all(pages.map((sourcePage) =>
        anilistRequest<{ Page: { pageInfo: { total: number; lastPage: number; hasNextPage: boolean }; airingSchedules: any[] } }>(RECENTLY_AIRED_QUERY, {
          page: sourcePage,
          perPage: 50,
          airingAt_lesser: now,
        })
      ));

      for (const data of results) {
        const batch = data.Page?.airingSchedules || [];
        sourceTotal = data.Page?.pageInfo?.total || sourceTotal;
        sourceLastPage = data.Page?.pageInfo?.lastPage || sourceLastPage;
        sourceEventsRead += batch.length;

        for (const schedule of batch) {
          if (!schedule.media || seenMediaIds.has(schedule.media.id)) continue;
          if (!schedule.media.title?.english && !schedule.media.title?.romaji) continue;
          seenMediaIds.add(schedule.media.id);
          const normalized = normalizeAnime({
            ...schedule.media,
            // A past official airing event is stronger evidence than a stale
            // NOT_YET_RELEASED flag on the media record.
            status: schedule.media.status === "NOT_YET_RELEASED"
              ? "RELEASING"
              : schedule.media.status,
            airingAt: schedule.airingAt,
            latestEpisode: schedule.episode,
          });
          if (isAllowedAnime(normalized)) uniqueAnime.push(normalized);
        }
      }

      apiPage += pages.length;
    }

    const start = (page - 1) * perPage;
    const media = uniqueAnime.slice(start, start + perPage);
    const uniqueRatio = sourceEventsRead > 0 ? uniqueAnime.length / sourceEventsRead : 1;
    const estimatedUniqueTotal = Math.max(uniqueAnime.length, Math.floor(sourceTotal * uniqueRatio));
    const lastPage = Math.max(page, Math.ceil(estimatedUniqueTotal / perPage));

    return {
      media,
      pageInfo: {
        total: estimatedUniqueTotal,
        perPage,
        currentPage: page,
        lastPage,
        hasNextPage: page < lastPage && (media.length === perPage || apiPage <= sourceLastPage),
      },
    };
  } catch (err) {
    console.error("Failed to fetch recently aired anime:", err);
    return {
      media: [],
      pageInfo: { total: 0, perPage, currentPage: page, lastPage: page, hasNextPage: false },
    };
  }
}

export async function getRecentlyAiredAnime(page = 1, perPage = 18): Promise<Anime[]> {
  return (await getRecentlyAiredAnimePage(page, perPage)).media;
}

export async function getAiringSchedule(
  start?: number,
  end?: number,
  perPage = 50
): Promise<AiringScheduleItem[]> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const startRange = start || now - 86400 * 2;
    const endRange = end || now + 86400 * 5;

    const data = await anilistRequest<{ Page: { airingSchedules: any[] } }>(AIRING_SCHEDULE_QUERY, {
      start: startRange,
      end: endRange,
      perPage,
    });

    const schedules = data.Page?.airingSchedules || [];
    return schedules
      .filter((s) => s.media && (s.media.title?.english || s.media.title?.romaji))
      .map((s) => ({
        id: s.id,
        airingAt: s.airingAt,
        episode: s.episode,
        timeUntilAiring: s.timeUntilAiring,
        anime: normalizeAnime({
          ...s.media,
          airingAt: s.airingAt,
          latestEpisode: s.airingAt <= now ? s.episode : undefined,
        }),
      }))
      .filter((item) => isAllowedAnime(item.anime));
  } catch (err) {
    console.error("Failed to fetch airing schedule:", err);
    return [];
  }
}

const ANILIST_GENRES = new Set([
  "Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy",
  "Horror", "Mahou Shoujo", "Mecha", "Music", "Mystery", "Psychological",
  "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller"
]);

function generateQueryCandidates(raw: string): string[] {
  const trimmed = raw.trim();
  const candidates: string[] = [];

  // 1. If contains 'x' without surrounding space: hunterx -> hunter x, hunterxhunter -> hunter x hunter, spyxfamily -> spy x family
  if (/x/i.test(trimmed)) {
    const xExpanded = trimmed
      .replace(/([a-zA-Z0-9])x([a-zA-Z0-9])/gi, "$1 x $2")
      .replace(/([a-zA-Z0-9])x$/gi, "$1 x")
      .replace(/\s+/g, " ")
      .trim();
    if (xExpanded.toLowerCase() !== trimmed.toLowerCase()) {
      candidates.push(xExpanded);
    }
  }

  // 2. Common anime prefixes/words concatenated without spaces
  const prefixes = [
    "hunter", "one", "solo", "jujutsu", "demon", "dragon", "black", "bleach",
    "death", "full", "my", "sword", "tokyo", "chainsaw", "attack", "spy",
    "naruto", "boruto", "haikyuu", "gintama", "berserk", "overlord", "steins"
  ];
  const lower = trimmed.toLowerCase();
  for (const pre of prefixes) {
    if (lower.startsWith(pre) && lower.length > pre.length) {
      const rest = trimmed.slice(pre.length).trim();
      candidates.push(`${trimmed.slice(0, pre.length)} ${rest}`);
    }
  }

  // 3. If query contains camelCase, split
  const camelSplit = trimmed.replace(/([a-z])([A-Z])/g, "$1 $2").trim();
  if (camelSplit !== trimmed) {
    candidates.push(camelSplit);
  }

  return Array.from(new Set(candidates));
}

export async function searchAnime(params: SearchFilterParams): Promise<AnimePageResult> {
  const variables: Record<string, any> = {
    page: params.page || 1,
    perPage: params.perPage || 24,
  };

  if (params.query && params.query.trim().length > 0) {
    variables.search = params.query.trim();
  }
  
  const genres = (params.genres || (params.genre ? [params.genre] : [])).filter(Boolean);
  if (genres.length > 0) {
    const pureGenres = genres.filter((g) => ANILIST_GENRES.has(g));
    const tagGenres = genres.filter((g) => !ANILIST_GENRES.has(g));
    if (pureGenres.length > 0) variables.genre_in = pureGenres;
    if (tagGenres.length > 0) variables.tag_in = tagGenres;
  }

  if (params.year) {
    variables.seasonYear = Number(params.year);
  }
  if (params.season) {
    variables.season = params.season;
  }
  if (params.format) {
    variables.format = params.format;
  }
  if (params.status) {
    variables.status = params.status;
  }
  if (params.score) {
    variables.averageScore_greater = params.score;
  }
  if (params.startDate_greater) {
    variables.startDate_greater = params.startDate_greater;
  }
  if (params.startDate_lesser) {
    variables.startDate_lesser = params.startDate_lesser;
  }
  if (params.sort) {
    variables.sort = [params.sort];
  }

  try {
    let data = await anilistRequest<{ Page: { pageInfo: any; media: any[] } }>(SEARCH_QUERY, variables);
    
    // If no media found and we had a search query, try smart candidate fallbacks (e.g. hunterx -> hunter x)
    if ((!data.Page.media || data.Page.media.length === 0) && variables.search) {
      const candidates = generateQueryCandidates(variables.search);
      for (const cand of candidates) {
        const fallbackVars = { ...variables, search: cand };
        const fallbackData = await anilistRequest<{ Page: { pageInfo: any; media: any[] } }>(SEARCH_QUERY, fallbackVars).catch(() => null);
        if (fallbackData?.Page?.media && fallbackData.Page.media.length > 0) {
          data = fallbackData;
          break;
        }
      }
    }

    return {
      pageInfo: data.Page.pageInfo,
      media: filterAnime((data.Page.media || []).map((m, idx) => normalizeAnime(m, idx + 1))),
    };
  } catch (err) {
    console.error("Failed to search anime:", err);
    return {
      pageInfo: {
        total: 0,
        perPage: params.perPage || 24,
        currentPage: params.page || 1,
        lastPage: 1,
        hasNextPage: false,
      },
      media: [],
    };
  }
}

export async function getUpcomingAnime(page = 1, perPage = 12): Promise<Anime[]> {
  try {
    const res = await searchAnime({
      status: "NOT_YET_RELEASED",
      sort: "POPULARITY_DESC",
      page,
      perPage,
    });
    return res.media;
  } catch (err) {
    console.error("Failed to fetch upcoming anime:", err);
    return [];
  }
}

export async function getCompletedAnime(page = 1, perPage = 10): Promise<Anime[]> {
  try {
    const res = await searchAnime({
      status: "FINISHED",
      sort: "SCORE_DESC",
      page,
      perPage,
    });
    return res.media;
  } catch (err) {
    console.error("Failed to fetch completed anime:", err);
    return [];
  }
}

export async function getAnimeDetails(id: number): Promise<Anime | null> {
  try {
    const data = await anilistRequest<{ Media: any }>(ANIME_DETAILS_QUERY, { id });
    if (!data.Media) return null;
    const anime = normalizeAnime(data.Media);
    return isAllowedAnime(anime) ? anime : null;
  } catch (err) {
    console.error("Failed to fetch anime details for ID " + id + ":", err);
    return null;
  }
}
