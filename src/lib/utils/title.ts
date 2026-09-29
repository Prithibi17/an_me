import { AnimeTitle } from "../anilist/types";
import { getStoredLanguage, AnimeNameLanguage } from "../storage/language";

export function getPreferredTitle(
  title?: AnimeTitle | null,
  langPreference?: AnimeNameLanguage
): string {
  if (!title) return "Unknown Anime";
  const pref = langPreference || getStoredLanguage();
  if (pref === "JP") {
    return title.romaji || title.english || title.native || "Untitled";
  }
  return title.english || title.romaji || title.native || "Untitled";
}

export function getSubtitle(
  title?: AnimeTitle | null,
  langPreference?: AnimeNameLanguage
): string | undefined {
  if (!title) return undefined;
  const pref = langPreference || getStoredLanguage();
  if (pref === "JP") {
    return title.english && title.english !== title.romaji
      ? title.english
      : title.native || undefined;
  }
  if (title.english && title.romaji && title.english !== title.romaji) {
    return title.romaji;
  }
  return title.native || undefined;
}
