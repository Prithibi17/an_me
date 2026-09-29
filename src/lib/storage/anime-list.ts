export interface SavedAnimeItem {
  animeId: number;
  title: string;
  coverImage: string;
  score?: number | null;
  format?: string | null;
  year?: number | null;
  savedAt: number;
}

const LIST_STORAGE_KEY = "kumo_anime_my_list";

export function getSavedAnimeList(): SavedAnimeItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to load saved anime list:", err);
    return [];
  }
}

export function isAnimeInList(animeId: number): boolean {
  const list = getSavedAnimeList();
  return list.some((item) => item.animeId === animeId);
}

export function toggleAnimeInList(anime: Omit<SavedAnimeItem, "savedAt">): boolean {
  if (typeof window === "undefined") return false;
  try {
    const list = getSavedAnimeList();
    const existingIdx = list.findIndex((item) => item.animeId === anime.animeId);
    let added = false;

    if (existingIdx >= 0) {
      list.splice(existingIdx, 1);
      added = false;
    } else {
      list.unshift({
        ...anime,
        savedAt: Date.now(),
      });
      added = true;
    }

    localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("kumo_list_updated"));
    return added;
  } catch (err) {
    console.error("Failed to toggle anime in list:", err);
    return false;
  }
}
