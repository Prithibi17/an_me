export interface AnimeTitle {
  english?: string | null;
  romaji?: string | null;
  native?: string | null;
}

export interface Character {
  id: number;
  name: {
    full: string;
    native?: string | null;
  };
  image?: {
    large?: string | null;
    medium?: string | null;
  } | null;
  role?: string | null;
}

export interface RelationNode {
  id: number;
  title: AnimeTitle;
  relationType: string;
  format?: string | null;
  status?: string | null;
  isAdult?: boolean;
  genres?: string[];
  duration?: number | null;
  countryOfOrigin?: string | null;
  tags?: { name: string; rank?: number | null }[];
  coverImage?: {
    large?: string | null;
    medium?: string | null;
  } | null;
}

export interface StreamingEpisode {
  title: string;
  thumbnail?: string | null;
  url?: string | null;
  site?: string | null;
}

export interface NextAiringEpisode {
  id: number;
  airingAt: number; // Unix timestamp in seconds
  timeUntilAiring: number; // Seconds until airing
  episode: number;
}

export interface AiringScheduleItem {
  id: number;
  airingAt: number;
  episode: number;
  timeUntilAiring: number;
  anime: Anime;
}

export interface Anime {
  id: number;
  idMal?: number | null;
  title: AnimeTitle;
  coverImage: string;
  coverColor?: string | null;
  bannerImage?: string | null;
  description?: string | null;
  score?: number | null;
  genres: string[];
  tags?: { name: string; rank?: number | null }[];
  episodes?: number | null;
  duration?: number | null;
  countryOfOrigin?: string | null;
  status?: string | null;
  isAdult?: boolean;
  format?: string | null;
  season?: string | null;
  seasonYear?: number | null;
  studios?: string[];
  source?: string | null;
  characters?: Character[];
  relations?: RelationNode[];
  recommendations?: Anime[];
  streamingEpisodes?: StreamingEpisode[];
  nextAiringEpisode?: NextAiringEpisode | null;
  latestAiredEpisode?: number | null;
  airingAt?: number | null;
  rank?: number;
  dataSources?: string[];
}

export interface PageInfo {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

export interface AnimePageResult {
  pageInfo: PageInfo;
  media: Anime[];
}

export type AnimeSeason = "WINTER" | "SPRING" | "SUMMER" | "FALL";
export type AnimeFormat = "TV" | "MOVIE" | "OVA" | "ONA" | "SPECIAL" | "MUSIC";
export type AnimeSort =
  | "TRENDING_DESC"
  | "POPULARITY_DESC"
  | "SCORE_DESC"
  | "START_DATE_DESC"
  | "UPDATED_AT_DESC"
  | "TITLE_ROMAJI"
  | "FAVOURITES_DESC";

export interface SearchFilterParams {
  query?: string;
  genre?: string;
  genres?: string[];
  year?: number;
  season?: AnimeSeason;
  format?: AnimeFormat;
  status?: string;
  score?: number;
  startDate_greater?: number;
  startDate_lesser?: number;
  sort?: AnimeSort;
  page?: number;
  perPage?: number;
}
