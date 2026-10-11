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
  vote_count?: number;
  width?: number;
  height?: number;
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

interface TmdbSeasonSummary {
  season_number: number;
  air_date?: string | null;
  episode_count?: number;
  name?: string;
}

interface TmdbEpisode {
  episode_number: number;
  name?: string;
  still_path?: string | null;
  runtime?: number | null;
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
  // TMDB stores later TV seasons under the original series, whose first-air
  // year can be much older. The exact season is validated separately below.
  const isNumberedTvSeason = anime.format !== "MOVIE" && Boolean(explicitSeasonNumber(anime));
  if (!isNumberedTvSeason && yearDistance > 2) return -1;

  const animeOrigin = anime.countryOfOrigin === "JP" || anime.countryOfOrigin === "CN";
  const matchingOrigin = result.origin_country?.includes(anime.countryOfOrigin || "") ||
    (anime.countryOfOrigin === "JP" && result.original_language === "ja") ||
    (anime.countryOfOrigin === "CN" && result.original_language === "zh");

  return (exact ? 100 : 60) - (isNumberedTvSeason ? 0 : yearDistance * 12) +
    (animeOrigin && matchingOrigin ? 8 : 0);
}

function chooseImage(
  files: ImageFile[] | undefined,
  languages: Array<string | null>,
  orientation: "landscape" | "portrait" | "logo",
) {
  if (!files?.length) return null;
  const suitable = files.filter((file) => {
    if (!file.width || !file.height) return true;
    const ratio = file.width / file.height;
    if (orientation === "landscape") return ratio >= 1.55;
    if (orientation === "portrait") return ratio >= 0.55 && ratio <= 0.8;
    return ratio >= 1.1;
  });
  return [...(suitable.length ? suitable : files)]
    .sort((a, b) => {
      const languageA = languages.indexOf(a.iso_639_1 ?? null);
      const languageB = languages.indexOf(b.iso_639_1 ?? null);
      const rankA = languageA === -1 ? languages.length : languageA;
      const rankB = languageB === -1 ? languages.length : languageB;
      return rankA - rankB ||
        (b.vote_count || 0) - (a.vote_count || 0) ||
        (b.vote_average || 0) - (a.vote_average || 0) ||
        (b.width || 0) - (a.width || 0);
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

function explicitSeasonNumber(anime: Anime) {
  const value = [anime.title.english, anime.title.romaji].filter(Boolean).join(" ");
  const match = value.match(/(?:season|series)\s*(\d+)|(?:^|\s)(\d+)(?:st|nd|rd|th)\s+season/i);
  return Number(match?.[1] || match?.[2]) || null;
}

function chooseTmdbSeason(anime: Anime, seasons: TmdbSeasonSummary[]) {
  const regular = seasons.filter((season) => season.season_number > 0);
  if (!regular.length) return null;

  const explicit = explicitSeasonNumber(anime);
  if (explicit) {
    const season = regular.find((item) => item.season_number === explicit);
    if (!season) return null;
    const airYear = season.air_date ? Number(season.air_date.slice(0, 4)) : null;
    if (anime.seasonYear && (!airYear || Math.abs(anime.seasonYear - airYear) > 1)) return null;
    if (anime.episodes && season.episode_count) {
      const allowedDifference = Math.max(2, Math.ceil(anime.episodes * 0.2));
      if (Math.abs(anime.episodes - season.episode_count) > allowedDifference) return null;
    }
    return season.season_number;
  }

  const best = [...regular].sort((a, b) => {
    const yearA = a.air_date ? Number(a.air_date.slice(0, 4)) : 0;
    const yearB = b.air_date ? Number(b.air_date.slice(0, 4)) : 0;
    const yearDistanceA = anime.seasonYear && yearA ? Math.abs(anime.seasonYear - yearA) : 99;
    const yearDistanceB = anime.seasonYear && yearB ? Math.abs(anime.seasonYear - yearB) : 99;
    const countDistanceA = anime.episodes && a.episode_count ? Math.abs(anime.episodes - a.episode_count) : 99;
    const countDistanceB = anime.episodes && b.episode_count ? Math.abs(anime.episodes - b.episode_count) : 99;
    return yearDistanceA - yearDistanceB || countDistanceA - countDistanceB || b.season_number - a.season_number;
  })[0];
  if (!best) return null;

  // Do not force a season match for continuously numbered, long-running shows
  // that TMDB divides into smaller seasons (for example, One Piece). An
  // incorrect still is worse than falling back to AniList/Kitsu artwork.
  if (regular.length > 1) {
    if (!anime.episodes || !best.episode_count) return null;
    const allowedDifference = Math.max(2, Math.ceil(anime.episodes * 0.2));
    if (Math.abs(anime.episodes - best.episode_count) > allowedDifference) return null;
  }

  return best.season_number;
}

function mergeEpisodeStills(anime: Anime, episodes: TmdbEpisode[]) {
  const byNumber = new Map<number, NonNullable<Anime["streamingEpisodes"]>[number]>();
  for (const episode of anime.streamingEpisodes || []) {
    const number = Number(episode.title.match(/Episode\s+(\d+)/i)?.[1]);
    if (Number.isInteger(number) && number > 0) byNumber.set(number, episode);
  }
  for (const episode of episodes) {
    if (!Number.isInteger(episode.episode_number) || episode.episode_number < 1) continue;
    const existing = byNumber.get(episode.episode_number);
    // Leave an entry absent when neither provider has a still. The episode
    // pipeline can then ask Kitsu for that individual missing preview.
    if (!episode.still_path && !existing) continue;
    byNumber.set(episode.episode_number, {
      ...existing,
      title: `Episode ${episode.episode_number}${episode.name ? ` - ${episode.name}` : ""}`,
      // TMDB is first choice; the existing AniList/Crunchyroll still remains
      // when TMDB has not published an episode image.
      thumbnail: episode.still_path ? `${IMAGE_ROOT}${episode.still_path}` : existing?.thumbnail,
      site: episode.still_path ? "TMDB" : existing?.site,
    });
  }
  return Array.from(byNumber.entries()).sort(([a], [b]) => a - b).map(([, episode]) => episode);
}

export async function enrichAnimeWithTmdb(
  anime: Anime,
  options: { includeEpisodeStills?: boolean } = {},
): Promise<Anime> {
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

  const numberedSeason = mediaType === "tv" ? explicitSeasonNumber(anime) : null;
  const [images, videos, tvDetails] = await Promise.all([
    tmdbFetch<{ backdrops?: ImageFile[]; posters?: ImageFile[]; logos?: ImageFile[] }>(
      `/${mediaType}/${match.id}/images?include_image_language=en,ja,zh,null`
    ),
    tmdbFetch<{ results?: VideoFile[] }>(`/${mediaType}/${match.id}/videos`),
    mediaType === "tv" && (options.includeEpisodeStills || Boolean(numberedSeason))
      ? tmdbFetch<{ seasons?: TmdbSeasonSummary[] }>(`/tv/${match.id}`)
      : Promise.resolve(null),
  ]);
  const tmdbSeasonNumber = mediaType === "tv" && tvDetails?.seasons
    ? chooseTmdbSeason(anime, tvDetails.seasons)
    : null;

  // A numbered season must match TMDB's season number and air year before any
  // TMDB media is accepted. Otherwise series-level trailers and episode stills
  // commonly belong to an older season.
  if (numberedSeason && !tmdbSeasonNumber) return anime;

  const [seasonDetails, seasonImages, seasonVideos] = tmdbSeasonNumber
    ? await Promise.all([
        options.includeEpisodeStills
          ? tmdbFetch<{ episodes?: TmdbEpisode[] }>(`/tv/${match.id}/season/${tmdbSeasonNumber}`)
          : Promise.resolve(null),
        tmdbFetch<{ posters?: ImageFile[] }>(
          `/tv/${match.id}/season/${tmdbSeasonNumber}/images?include_image_language=en,ja,zh,null`
        ),
        tmdbFetch<{ results?: VideoFile[] }>(`/tv/${match.id}/season/${tmdbSeasonNumber}/videos`),
      ])
    : [null, null, null];

  // Logos/backdrops are series-level on TMDB. For a numbered season, retain
  // the exact-season AniList artwork instead of showing an older season image.
  const logoPath = numberedSeason
    ? null
    : chooseImage(images?.logos, ["en", "ja", "zh", null], "logo");
  // A null image language normally indicates artwork without baked-in text,
  // which is the safest backdrop when a separate title logo is overlaid.
  const backdropPath = numberedSeason
    ? null
    : chooseImage(images?.backdrops, [null, "ja", "en", "zh"], "landscape");
  const posterPath = chooseImage(
    numberedSeason ? seasonImages?.posters : images?.posters,
    ["en", null, "ja", "zh"],
    "portrait",
  );
  const trailer = chooseTrailer(numberedSeason ? seasonVideos?.results : videos?.results);

  return {
    ...anime,
    coverImage: posterPath ? `${IMAGE_ROOT}${posterPath}` : anime.coverImage,
    bannerImage: backdropPath ? `${IMAGE_ROOT}${backdropPath}` : anime.bannerImage,
    titleLogo: logoPath ? `${IMAGE_ROOT}${logoPath}` : anime.titleLogo,
    streamingEpisodes: seasonDetails?.episodes?.length
      ? mergeEpisodeStills(anime, seasonDetails.episodes)
      : anime.streamingEpisodes,
    trailer: trailer ? {
      youtubeId: trailer.key,
      name: trailer.name || `${titles[0]} official trailer`,
      type: trailer.type,
      official: Boolean(trailer.official),
    } : numberedSeason ? null : anime.trailer,
    tmdb: { id: match.id, mediaType },
    dataSources: Array.from(new Set([...(anime.dataSources || ["AniList"]), "TMDB"])),
  };
}
