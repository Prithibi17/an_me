export interface SeasonMatchAnime {
  title: { english?: string | null; romaji?: string | null };
  seasonYear?: number | null;
  episodes?: number | null;
}

export interface TmdbSeasonSummary {
  season_number: number;
  air_date?: string | null;
  episode_count?: number;
  name?: string;
}

export function explicitSeasonNumber(anime: SeasonMatchAnime) {
  const value = [anime.title.english, anime.title.romaji].filter(Boolean).join(" ");
  const match = value.match(/(?:season|series)\s*(\d+)|(?:^|\s)(\d+)(?:st|nd|rd|th)\s+season/i);
  return Number(match?.[1] || match?.[2]) || null;
}

function airYear(season: TmdbSeasonSummary) {
  return season.air_date ? Number(season.air_date.slice(0, 4)) || null : null;
}

function episodeDifference(anime: SeasonMatchAnime, season: TmdbSeasonSummary) {
  if (!anime.episodes || !season.episode_count) return null;
  return Math.abs(anime.episodes - season.episode_count);
}

function episodeCountMatches(anime: SeasonMatchAnime, season: TmdbSeasonSummary) {
  const difference = episodeDifference(anime, season);
  if (difference === null) return true;
  return difference <= Math.max(2, Math.ceil(anime.episodes! * 0.2));
}

/**
 * Select a season only when TMDB's release year and episode count identify the
 * same AniList installment. Returning null is intentional: retaining AniList's
 * exact-installment poster is safer than borrowing artwork from another season.
 */
export function chooseTmdbSeason(anime: SeasonMatchAnime, seasons: TmdbSeasonSummary[]) {
  const regular = seasons.filter((season) => season.season_number > 0);
  if (!regular.length) return null;

  const explicit = explicitSeasonNumber(anime);
  if (explicit) {
    const season = regular.find((item) => item.season_number === explicit);
    if (!season) return null;
    const year = airYear(season);
    if (anime.seasonYear && (!year || Math.abs(anime.seasonYear - year) > 1)) return null;
    if (!episodeCountMatches(anime, season)) return null;
    return season.season_number;
  }

  const candidates = regular.filter((season) => {
    const year = airYear(season);
    if (anime.seasonYear && (!year || Math.abs(anime.seasonYear - year) > 1)) return false;
    return episodeCountMatches(anime, season);
  });

  if (!candidates.length) return null;
  if (candidates.length === 1) return candidates[0].season_number;

  // Multiple seasons need enough metadata to disambiguate them. If two
  // candidates are equally plausible, do not guess based on season number.
  if (!anime.seasonYear && !anime.episodes) return null;
  const ranked = candidates.map((season) => ({
    season,
    yearDistance: anime.seasonYear && airYear(season)
      ? Math.abs(anime.seasonYear - airYear(season)!)
      : 99,
    countDistance: episodeDifference(anime, season) ?? 99,
  })).sort((a, b) =>
    a.yearDistance - b.yearDistance || a.countDistance - b.countDistance
  );
  const [best, runnerUp] = ranked;
  if (runnerUp && best.yearDistance === runnerUp.yearDistance && best.countDistance === runnerUp.countDistance) {
    return null;
  }
  return best.season.season_number;
}
