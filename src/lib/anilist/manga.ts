import { getSearchCorrections } from "@/lib/search/query-enhancer";

export interface MangaTitle {
  english?: string | null;
  romaji?: string | null;
  native?: string | null;
}

export interface Manga {
  id: number;
  title: MangaTitle;
  coverImage: string;
  bannerImage?: string | null;
  description?: string | null;
  score?: number | null;
  genres: string[];
  format?: string | null;
  status?: string | null;
  chapters?: number | null;
  volumes?: number | null;
  startDate?: { year?: number | null; month?: number | null; day?: number | null } | null;
  updatedAt?: number | null;
  countryOfOrigin?: string | null;
  synonyms?: string[];
}

interface RawManga {
  id: number;
  title?: MangaTitle | null;
  coverImage?: { extraLarge?: string | null; large?: string | null; medium?: string | null } | null;
  bannerImage?: string | null;
  description?: string | null;
  averageScore?: number | null;
  genres?: string[] | null;
  format?: string | null;
  status?: string | null;
  chapters?: number | null;
  volumes?: number | null;
  startDate?: Manga["startDate"];
  updatedAt?: number | null;
  countryOfOrigin?: string | null;
  synonyms?: string[] | null;
}

interface MangaPageInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

const ENDPOINT = "https://graphql.anilist.co";
const FIELDS = `
  id
  title { english romaji native }
  coverImage { extraLarge large medium }
  bannerImage
  description(asHtml: false)
  averageScore
  genres
  format
  status
  chapters
  volumes
  startDate { year month day }
  updatedAt
  countryOfOrigin
`;

const QUERY = `
  query MangaHome($page: Int, $perPage: Int, $sort: [MediaSort], $status: MediaStatus, $search: String, $startDateGreater: FuzzyDateInt) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage }
      media(type: MANGA, sort: $sort, status: $status, search: $search, startDate_greater: $startDateGreater, isAdult: false) {
        ${FIELDS}
      }
    }
  }
`;

const DETAILS_QUERY = `query MangaDetails($id: Int!) { Media(id: $id, type: MANGA) { ${FIELDS} synonyms staff(perPage: 8) { nodes { id name { full } } } } }`;

function normalize(raw: RawManga): Manga {
  return {
    id: raw.id,
    title: raw.title || {},
    coverImage: raw.coverImage?.extraLarge || raw.coverImage?.large || raw.coverImage?.medium || "/anme-icon.png",
    bannerImage: raw.bannerImage || null,
    description: raw.description?.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, "").trim() || null,
    score: raw.averageScore || null,
    genres: raw.genres || [],
    format: raw.format || null,
    status: raw.status || null,
    chapters: raw.chapters || null,
    volumes: raw.volumes || null,
    startDate: raw.startDate || null,
    updatedAt: raw.updatedAt || null,
    countryOfOrigin: raw.countryOfOrigin || null,
    synonyms: raw.synonyms || [],
  };
}

async function request<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`AniList manga request failed: ${response.status}`);
  const payload = await response.json();
  if (payload.errors?.length) throw new Error(payload.errors[0].message || "AniList manga request failed");
  return payload.data as T;
}

async function requestMangaList(options: {
  sort: string[];
  status?: string;
  search?: string;
  perPage?: number;
  page?: number;
  startDateGreater?: number;
}) {
  return request<{ Page: { pageInfo: MangaPageInfo; media: RawManga[] } }>(QUERY, {
    page: options.page || 1,
    perPage: options.perPage || 12,
    sort: options.sort,
    status: options.status,
    search: options.search?.trim() || undefined,
    startDateGreater: options.startDateGreater,
  });
}

export async function getMangaList(options: {
  sort: string[];
  status?: string;
  search?: string;
  perPage?: number;
  page?: number;
  startDateGreater?: number;
}) {
  try {
    let data = await requestMangaList(options);
    if (options.search?.trim() && !data.Page.media?.length) {
      const corrections = await getSearchCorrections(options.search, "manga");
      for (const search of corrections) {
        const corrected = await requestMangaList({ ...options, search }).catch(() => null);
        if (corrected?.Page.media?.length) {
          data = corrected;
          break;
        }
      }
      if (!data.Page.media?.length) {
        data = await requestMangaList({ ...options, search: undefined, sort: ["POPULARITY_DESC"], page: 1 });
      }
    }
    return { pageInfo: data.Page.pageInfo, media: (data.Page.media || []).map(normalize) };
  } catch (error) {
    console.error("Failed to load manga:", error);
    return { pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false }, media: [] as Manga[] };
  }
}

export async function getMangaDetails(id: number) {
  try {
    const data = await request<{ Media: RawManga | null }>(DETAILS_QUERY, { id });
    return data.Media ? normalize(data.Media) : null;
  } catch (error) {
    console.error(`Failed to load manga ${id}:`, error);
    return null;
  }
}

export function mangaTitle(manga: Manga) {
  return manga.title.english || manga.title.romaji || manga.title.native || "Untitled manga";
}

export function publicationType(country?: string | null, format?: string | null) {
  if (format === "NOVEL") return "Novel";
  if (country === "KR") return "Manhwa";
  if (country === "CN" || country === "TW" || country === "HK") return "Manhua";
  if (country === "JP") return "Manga";
  return "Comic";
}

export function mangaDate(manga: Manga) {
  const date = manga.startDate;
  if (!date?.year) return "Date not announced";
  return new Intl.DateTimeFormat("en", { year: "numeric", month: date.month ? "short" : undefined, day: date.day ? "numeric" : undefined })
    .format(new Date(Date.UTC(date.year, Math.max(0, (date.month || 1) - 1), date.day || 1)));
}
