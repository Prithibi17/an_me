import type { Anime } from "./types";

const BLOCKED_TAGS = new Set([
  "Advertisement",
  "Commercial",
  "Educational",
  "Kids",
  "Promotional Video",
  "Recap",
  "Trailer",
]);

/**
 * Central site-wide content policy. This intentionally uses only AniList
 * metadata and defaults to keeping a title whenever classification is unclear.
 */
export function isAllowedMetadata(anime: Pick<Anime, "format" | "tags" | "duration" | "isAdult">): boolean {
  // Reject all AniList adult/hentai entries at the shared boundary, including
  // direct detail URLs, relations, recommendations, and schedule results.
  if (anime.isAdult === true) return false;
  // MUSIC is AniList's short music-video format. The Music genre on normal
  // TV/Movie/OVA/ONA anime is deliberately allowed.
  if (anime.format === "MUSIC") return false;

  const tagNames = (anime.tags || []).map((tag) => tag.name);

  if (tagNames.some((tag) => BLOCKED_TAGS.has(tag))) return false;

  // AniList often classifies mobile/social promotional shorts as ONA rather
  // than MUSIC or advertisement. Limit this rule to ultra-short vertical
  // videos so ordinary short-form and chibi story anime remain available.
  const isUltraShortVerticalVideo =
    typeof anime.duration === "number" &&
    anime.duration <= 2 &&
    (anime.tags || []).some((tag) => tag.name === "Vertical Video");

  return !isUltraShortVerticalVideo;
}

export function isAllowedAnime(anime: Anime): boolean {
  return isAllowedMetadata(anime);
}

export function filterAnime(items: Anime[]): Anime[] {
  return items.filter(isAllowedAnime);
}
