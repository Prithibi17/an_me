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
import releasedCatalog from "@/data/released-anilist-catalog.json";
import releaseFeed from "@/data/anilist-release-feed.json";
import { selectLatestVerifiedSchedules, type ReleaseSchedule } from "./release-feed";
import { getSearchCorrections } from "@/lib/search/query-enhancer";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

async function anilistRequest<T>(query: string, variables: Record<string, any> = {}, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
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

      if (!res.ok) {
        const errorBody = await res.text().catch(() => "");
        const error = new Error("AniList request failed: " + res.status + " " + res.statusText + " " + errorBody);
        if (res.status === 429 && attempt < retries) {
          const retryAfter = Number(res.headers.get("retry-after"));
          await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) ? Math.min(retryAfter * 1000, 5000) : 1500));
          lastError = error;
          continue;
        }
        throw error;
      }

      const json = await res.json();
      if (json.errors && json.errors.length > 0) {
        throw new Error(json.errors[0].message || "GraphQL error");
      }
      return json.data;
    } catch (error) {
      lastError = error;
      if (attempt >= retries) break;
      await new Promise((resolve) => setTimeout(resolve, 750 * (attempt + 1)));
    }
  }
  throw lastError;
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

const RELEASED_CATALOG_STATUSES = ["FINISHED", "RELEASING", "HIATUS"];
const RELEASED_CATALOG_IDS = releasedCatalog.ids as number[];
const VERIFIED_RELEASES = releaseFeed.releases as Array<{ mediaId: number; episode: number; airingAt: number; scheduleId: number }>;

function tomorrowDateInt() {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return Number(tomorrow.toISOString().slice(0, 10).replaceAll("-", ""));
}

/** Full released catalog backed by a current AniList-ID index, avoiding AniList's 5,000-item cap. */
export async function getFullAnimeCatalogPage(page = 1, perPage = 36): Promise<AnimePageResult> {
  const safePage = Math.max(1, page);
  const releasedBefore = tomorrowDateInt();
  const latest = await searchAnime({
    sort: "START_DATE_DESC",
    statusIn: RELEASED_CATALOG_STATUSES,
    startDate_lesser: releasedBefore,
    page: 1,
    perPage: 50,
  });
  const latestIds = latest.media.map((anime) => anime.id);
  const latestIdSet = new Set(latestIds);
  const ids = [...latestIds, ...RELEASED_CATALOG_IDS.filter((id) => !latestIdSet.has(id))];
  const total = ids.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const start = (safePage - 1) * perPage;
  const pageIds = ids.slice(start, start + perPage);
  if (pageIds.length === 0) {
    return { media: [], pageInfo: { total, perPage, currentPage: safePage, lastPage, hasNextPage: false } };
  }

  const latestById = new Map(latest.media.map((anime) => [anime.id, anime]));
  const missingIds = pageIds.filter((id) => !latestById.has(id));
  const resolved = missingIds.length
    ? await searchAnime({ idIn: missingIds, sort: "START_DATE_DESC", page: 1, perPage: Math.min(50, missingIds.length) })
    : { media: [] };
  const mediaById = new Map([...latest.media, ...resolved.media].map((anime) => [anime.id, anime]));
  const media = pageIds.map((id) => mediaById.get(id)).filter((anime): anime is Anime => Boolean(anime));
  return {
    media,
    pageInfo: { total, perPage, currentPage: safePage, lastPage, hasNextPage: safePage < lastPage },
  };
}

export async function getRecentlyAiredAnimePage(page = 1, perPage = 30, snapshot?: number): Promise<AnimePageResult> {
  try {
    const currentSnapshot = Math.floor(Date.now() / 300_000) * 300;
    const asOf = Number.isInteger(snapshot) && snapshot! > 0
      ? Math.min(snapshot!, currentSnapshot)
      : currentSnapshot;
    type RawSchedule = ReleaseSchedule & { media?: any };
    const recent = await anilistRequest<{ Page: { airingSchedules: RawSchedule[] } }>(RECENTLY_AIRED_QUERY, {
      page: 1,
      perPage: 50,
      airingAt_lesser: asOf,
    });
    const recentSchedules = selectLatestVerifiedSchedules(recent.Page?.airingSchedules || [], asOf);
    const releasesByMedia = new Map(
      VERIFIED_RELEASES.filter((item) => item.airingAt <= asOf).map((item) => [item.mediaId, item]),
    );
    for (const item of recentSchedules) {
      const mediaId = Number(item.media?.id);
      if (!isAllowedAnime(normalizeAnime(item.media))) continue;
      const existing = releasesByMedia.get(mediaId);
      if (!existing || item.airingAt > existing.airingAt || (item.airingAt === existing.airingAt && item.id > existing.scheduleId)) {
        releasesByMedia.set(mediaId, { mediaId, episode: item.episode, airingAt: item.airingAt, scheduleId: item.id });
      }
    }
    const releases = [...releasesByMedia.values()].sort((a, b) => b.airingAt - a.airingAt || b.scheduleId - a.scheduleId);
    const total = releases.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const pageRecords = releases.slice((page - 1) * perPage, page * perPage);
    if (pageRecords.length === 0) {
      return { media: [], pageInfo: { total, perPage, currentPage: page, lastPage, hasNextPage: false } };
    }

    // Resolve the complete page in one exact ID query. Mixing schedule-embedded
    // media with a second partial lookup caused some valid records to disappear
    // from otherwise full pages.
    const resolved = await searchAnime({ idIn: pageRecords.map((item) => item.mediaId), page: 1, perPage: pageRecords.length });
    const mediaById = new Map(resolved.media.map((anime) => [anime.id, anime] as const));
    const media = pageRecords
      .flatMap((release): Anime[] => {
        const anime = mediaById.get(release.mediaId);
        if (!anime) return [];
        const releasedAnime: Anime = { ...anime, latestAiredEpisode: release.episode, latestReleasedEpisodeAt: release.airingAt, airingAt: release.airingAt };
        return isAllowedAnime(releasedAnime) ? [releasedAnime] : [];
      })
      ;
    return { media, pageInfo: { total, perPage, currentPage: page, lastPage, hasNextPage: page < lastPage } };
  } catch (err) {
    console.error("Failed to fetch recently aired anime:", err);
    return {
      media: [],
      pageInfo: { total: 0, perPage, currentPage: page, lastPage: 1, hasNextPage: false },
      error: "The release feed is temporarily unavailable. Please try again shortly.",
    };
  }
}

export async function getRecentlyAiredAnime(page = 1, perPage = 18): Promise<Anime[]> {
  try {
    const now = Math.floor(Date.now() / 300_000) * 300;
    const data = await anilistRequest<{ Page: { airingSchedules: any[] } }>(RECENTLY_AIRED_QUERY, {
      page,
      perPage: Math.min(50, Math.max(perPage * 3, perPage)),
      airingAt_lesser: now,
    });
    const seen = new Set<number>();
    const items: Anime[] = [];
    for (const schedule of data.Page?.airingSchedules || []) {
      if (!schedule.media || seen.has(schedule.media.id)) continue;
      if (!Number.isInteger(schedule.episode) || schedule.episode < 1 || schedule.airingAt > now) continue;
      seen.add(schedule.media.id);
      const anime = normalizeAnime({
        ...schedule.media,
        airingAt: schedule.airingAt,
        latestReleasedEpisodeAt: schedule.airingAt,
        latestEpisode: schedule.episode,
      });
      if (isAllowedAnime(anime)) items.push(anime);
      if (items.length >= perPage) break;
    }
    return items;
  } catch (err) {
    console.error("Failed to fetch recent homepage releases:", err);
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

  if (params.idIn?.length) variables.id_in = params.idIn;

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
  if (params.statusNot) {
    variables.status_not = params.statusNot;
  }
  if (params.statusIn?.length) {
    variables.status_in = params.statusIn;
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
    
    // If AniList's strict title search misses, try spacing rules first and then
    // a bounded AI/local spelling correction. Every candidate is verified by
    // AniList before it is shown, so the model can never create catalog items.
    if ((!data.Page.media || data.Page.media.length === 0) && variables.search) {
      const candidates = Array.from(new Set([
        ...generateQueryCandidates(variables.search),
        ...await getSearchCorrections(variables.search, "anime"),
      ])).slice(0, 4);
      for (const cand of candidates) {
        const fallbackVars = { ...variables, search: cand };
        const fallbackData = await anilistRequest<{ Page: { pageInfo: any; media: any[] } }>(SEARCH_QUERY, fallbackVars).catch(() => null);
        if (fallbackData?.Page?.media && fallbackData.Page.media.length > 0) {
          data = fallbackData;
          break;
        }
      }

      // A completely unknown query still gets useful catalog suggestions rather
      // than a dead end. Existing filters remain applied.
      if (!data.Page.media || data.Page.media.length === 0) {
        const suggestionVars = { ...variables, search: undefined, sort: ["POPULARITY_DESC"], page: 1 };
        data = await anilistRequest<{ Page: { pageInfo: any; media: any[] } }>(SEARCH_QUERY, suggestionVars);
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
