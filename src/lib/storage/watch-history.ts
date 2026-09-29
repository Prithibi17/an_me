export interface WatchProgress {
  animeId: number;
  animeTitle: string;
  coverImage: string;
  bannerImage?: string | null;
  episode: number;
  episodeTitle?: string;
  currentTime: number;
  duration: number;
  updatedAt: number;
}

const STORAGE_KEY = "kumo_anime_watch_history";

export function getWatchHistory(): WatchProgress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (err) {
    console.error("Failed to load watch history:", err);
    return [];
  }
}

export function getAnimeWatchProgress(animeId: number): WatchProgress | null {
  const history = getWatchHistory();
  return history.find((h) => h.animeId === animeId) || null;
}

export function saveWatchProgress(progress: Omit<WatchProgress, "updatedAt">): void {
  if (typeof window === "undefined") return;
  try {
    const history = getWatchHistory();
    const existingIdx = history.findIndex((h) => h.animeId === progress.animeId);

    const item: WatchProgress = {
      ...progress,
      updatedAt: Date.now(),
    };

    if (existingIdx >= 0) {
      history[existingIdx] = item;
    } else {
      history.unshift(item);
    }

    // Keep top 50 items
    const trimmed = history.slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new Event("kumo_history_updated"));
  } catch (err) {
    console.error("Failed to save watch progress:", err);
  }
}

export function removeWatchProgress(animeId: number): void {
  if (typeof window === "undefined") return;
  try {
    const history = getWatchHistory().filter((h) => h.animeId !== animeId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    window.dispatchEvent(new Event("kumo_history_updated"));
  } catch (err) {
    console.error("Failed to remove watch progress:", err);
  }
}
