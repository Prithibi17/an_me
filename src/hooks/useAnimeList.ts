"use client";

import { useEffect, useState } from "react";
import {
  getSavedAnimeList,
  isAnimeInList,
  SavedAnimeItem,
  toggleAnimeInList,
} from "../lib/storage/anime-list";

export function useAnimeList(animeId?: number) {
  const [savedList, setSavedList] = useState<SavedAnimeItem[]>([]);
  const [inList, setInList] = useState(false);

  useEffect(() => {
    function update() {
      setSavedList(getSavedAnimeList());
      if (animeId) {
        setInList(isAnimeInList(animeId));
      }
    }

    update();

    window.addEventListener("kumo_list_updated", update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener("kumo_list_updated", update);
      window.removeEventListener("storage", update);
    };
  }, [animeId]);

  const toggle = (anime: Omit<SavedAnimeItem, "savedAt">) => {
    const newState = toggleAnimeInList(anime);
    setInList(newState);
    return newState;
  };

  return { savedList, inList, toggle };
}
