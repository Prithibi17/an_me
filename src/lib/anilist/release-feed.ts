export type ReleaseSchedule = {
  id: number;
  airingAt: number;
  episode: number;
  media?: { id?: number; status?: string | null; isAdult?: boolean; title?: { english?: string | null; romaji?: string | null } | null } | null;
};

/**
 * Produces one latest confirmed past schedule per independent AniList media ID.
 * Filtering, stable sorting, and deduplication intentionally happen before pagination.
 */
export function selectLatestVerifiedSchedules<T extends ReleaseSchedule>(schedules: T[], asOf: number): T[] {
  const ordered = schedules
    .filter((item) =>
      Number.isInteger(item.id) && item.id > 0 &&
      Number.isInteger(item.episode) && item.episode > 0 &&
      Number.isInteger(item.airingAt) && item.airingAt > 0 && item.airingAt <= asOf &&
      Number.isInteger(item.media?.id) && Number(item.media?.id) > 0 &&
      item.media?.status !== "CANCELLED" && item.media?.status !== "NOT_YET_RELEASED" && !item.media?.isAdult &&
      Boolean(item.media?.title?.english || item.media?.title?.romaji)
    )
    .sort((a, b) => b.airingAt - a.airingAt || b.id - a.id);

  const seen = new Set<number>();
  return ordered.filter((item) => {
    const mediaId = Number(item.media!.id);
    if (seen.has(mediaId)) return false;
    seen.add(mediaId);
    return true;
  });
}
