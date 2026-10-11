import "server-only";

import type { Anime } from "@/lib/anilist/types";

const API_ROOT = "https://api.themoviedb.org/3";
const IMAGE_ROOT = "https://image.tmdb.org/t/p/original";

type MediaType = "tv" | "movie";

interface SearchResult {
  id: number;
  name?: string;
  original_name?: string;
  title?: string;
  original_title?: string;
  first_air_date?: string;
  release_date?: string;
  origin_country?: string[];
  original_language?: string;
  genre_ids?: number[];
}

interface ImageFile {
  file_path: string;
  iso_639_1?: string | null;
  vote_average?: number;
  width?: number;
}

interface VideoFile {
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
  iso_639_1?: string;
  published_at?: string;
}

function normalize(value?: string | null) {
  return (value || "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function tmdbFetch<T>(path: string): Promise<T | null> {
  const token = process.env.TMDB_API_READ_TOKEN?.trim();
  if (!token) return null;

  try {
    const response = await fetch(`${API_ROOT}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      next: { revalidate: 86_400 },
    });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

function candidateScore(anime: Anime, result: SearchResult) {
  // TMDB genre 16 is Animation. Reject similarly named live-action matches.
  if (!result.genre_ids?.includes(16)) return -1;
  const wanted = [anime.title.english, anime.title.romaji, anime.title.native]
    .map(normalize)
    .filter(Boolean);
  const offered = [result.name, result.original_name, result.title, result.original_title]
    .map(normalize)
    .filter(Boolean);

  const exact = wanted.some((title) => offered.includes(title));
  const close = wanted.some((title) => offered.some((candidate) =>
    title.length >= 5 && (candidate.includes(title) || title.includes(candidate))
  ));
  if (!exact && !close) return -1;

  const date = result.first_air_date || result.release_date;
  const year = date ? Number(date.slice(0, 4)) : null;
  const yearDistance = anime.seasonYear && year ? Math.abs(anime.seasonYear - year) : 0;
  if (yearDistance > 2) return -1;

  const animeOrigin = anime.countryOfOrigin === "JP" || anime.countryOfOrigin === "CN";
  const matchingOrigin = result.origin_country?.includes(anime.countryOfOrigin || "") ||
    (anime.countryOfOrigin === "JP" && result.original_language === "ja") ||
    (anime.countryOfOrigin === "CN" && result.original_language === "zh");

  return (exact ? 100 : 60) - yearDistance * 12 + (animeOrigin && matchingOrigin ? 8 : 0);
}

function chooseImage(files: ImageFile[] | undefined, languages: Array<string | null>) {
  if (!files?.length) return null;
  return [...files]
    .sort((a, b) => {
      const languageA = languages.indexOf(a.iso_639_1 ?? null);
      const languageB = languages.indexOf(b.iso_639_1 ?? null);
      const rankA = languageA === -1 ? languages.length : languageA;
      const rankB = languageB === -1 ? languages.length : languageB;
      return rankA - rankB || (b.vote_average || 0) - (a.vote_average || 0) || (b.width || 0) - (a.width || 0);
    })[0]?.file_path || null;
}

function chooseTrailer(videos: VideoFile[] | undefined) {
  const usable = (videos || []).filter((video) => video.site === "YouTube" && video.key);
  return usable.sort((a, b) => {
    const typeRank = (type: string) => type === "Trailer" ? 0 : type === "Teaser" ? 1 : 2;
    const languageRank = (language?: string) => language === "en" ? 0 : language === "ja" ? 1 : 2;
    return Number(Boolean(b.official)) - Number(Boolean(a.official)) ||
      typeRank(a.type) - typeRank(b.type) ||
      languageRank(a.iso_639_1) - languageRank(b.iso_639_1) ||
      (b.published_at || "").localeCompare(a.published_at || "");
  })[0] || null;
}

export async function enrichAnimeWithTmdb(anime: Anime): Promise<Anime> {
  if (!process.env.TMDB_API_READ_TOKEN?.trim()) return anime;

  const mediaType: MediaType = anime.format === "MOVIE" ? "movie" : "tv";
  const titles = Array.from(new Set(
    [anime.title.english, anime.title.romaji, anime.title.native].filter((title): title is string => Boolean(title))
  )).slice(0, 2);
  if (!titles.length) return anime;

  // Search more than one known title because TMDB may index an anime under its
  // English title while AniList's preferred title is Romaji (or vice versa).
  const searches = await Promise.all(titles.map((title) =>
    tmdbFetch<{ results?: SearchResult[] }>(
      `/search/${mediaType}?query=${encodeURIComponent(title)}&include_adult=false`
    )
  ));
  const candidates = Array.from(new Map(
    searches.flatMap((search) => search?.results || []).map((result) => [result.id, result])
  ).values());
  const match = candidates
    .map((result) => ({ result, score: candidateScore(anime, result) }))
    .filter(({ score }) => score >= 60)
    .sort((a, b) => b.score - a.score)[0]?.result;
  if (!match) return anime;

  const [images, videos] = await Promise.all([
    tmdbFetch<{ backdrops?: ImageFile[]; posters?: ImageFile[]; logos?: ImageFile[] }>(
      `/${mediaType}/${match.id}/images?include_image_language=en,ja,zh,null`
    ),
    tmdbFetch<{ results?: VideoFile[] }>(`/${mediaType}/${match.id}/videos`),
  ]);
  const logoPath = chooseImage(images?.logos, ["en", "ja", "zh", null]);
  const backdropPath = chooseImage(images?.backdrops, [null, "en", "ja", "zh"]);
  const posterPath = chooseImage(images?.posters, ["en", null, "ja", "zh"]);
  const trailer = chooseTrailer(videos?.results);

  return {
    ...anime,
    coverImage: posterPath ? `${IMAGE_ROOT}${posterPath}` : anime.coverImage,
    bannerImage: backdropPath ? `${IMAGE_ROOT}${backdropPath}` : anime.bannerImage,
    titleLogo: logoPath ? `${IMAGE_ROOT}${logoPath}` : anime.titleLogo,
    trailer: trailer ? {
      youtubeId: trailer.key,
      name: trailer.name || `${titles[0]} official trailer`,
      type: trailer.type,
      official: Boolean(trailer.official),
    } : anime.trailer,
    tmdb: { id: match.id, mediaType },
    dataSources: Array.from(new Set([...(anime.dataSources || ["AniList"]), "TMDB"])),
  };
}
