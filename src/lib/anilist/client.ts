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

export async function getRecentlyAiredAnime(page = 1, perPage = 18): Promise<Anime[]> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const targetEnd = page * perPage;
    const schedules: any[] = [];
    // AniList pages airing events, not anime. Build one stable, globally
    // deduplicated stream first so an anime cannot move onto multiple UI pages.
    for (let apiPage = 1; apiPage <= Math.max(3, page * 2); apiPage++) {
      const data = await anilistRequest<{ Page: { airingSchedules: any[] } }>(RECENTLY_AIRED_QUERY, {
        page: apiPage,
        perPage: 50,
        airingAt_lesser: now,
      });
      const batch = data.Page?.airingSchedules || [];
      schedules.push(...batch);
      if (batch.length < 50) break;
      const uniqueCount = new Set(schedules.map((schedule) => schedule.media?.id).filter(Boolean)).size;
      if (uniqueCount >= targetEnd + perPage) break;
    }

    const seenMediaIds = new Set<number>();
    const uniqueAnime: Anime[] = [];

    for (const schedule of schedules) {
      if (!schedule.media || seenMediaIds.has(schedule.media.id)) continue;
      // Only include valid television/ONA/web releases with title
      if (!schedule.media.title?.english && !schedule.media.title?.romaji) continue;

      seenMediaIds.add(schedule.media.id);
      const normalized = normalizeAnime({
        ...schedule.media,
        airingAt: schedule.airingAt,
        latestEpisode: schedule.episode,
      });
      if (!isAllowedAnime(normalized)) continue;
      if (isAllowedAnime(normalized)) uniqueAnime.push(normalized);
    }

    const start = (page - 1) * perPage;
    return uniqueAnime.slice(start, start + perPage);
  } catch (err) {
    console.error("Failed to fetch recently aired anime:", err);
    return [];
  }
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
