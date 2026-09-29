"use client";

import { useState, useEffect } from "react";

export type AnimeNameLanguage = "EN" | "JP";

const STORAGE_KEY = "kumo_anime_name_lang";
const EVENT_NAME = "kumo-anime-lang-change";

export function getStoredLanguage(): AnimeNameLanguage {
  if (typeof window === "undefined") return "EN";
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val === "JP" ? "JP" : "EN";
  } catch {
    return "EN";
  }
}

export function setStoredLanguage(lang: AnimeNameLanguage) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: lang }));
  } catch (err) {
    console.error(err);
  }
}

export function useAnimeNameLanguage(): [AnimeNameLanguage, () => void] {
  const [lang, setLang] = useState<AnimeNameLanguage>("EN");

  useEffect(() => {
    setLang(getStoredLanguage());

    const handleEvent = (e: Event) => {
      const custom = e as CustomEvent<AnimeNameLanguage>;
      if (custom.detail) {
        setLang(custom.detail);
      } else {
        setLang(getStoredLanguage());
      }
    };

    window.addEventListener(EVENT_NAME, handleEvent);
    window.addEventListener("storage", handleEvent);
    return () => {
      window.removeEventListener(EVENT_NAME, handleEvent);
      window.removeEventListener("storage", handleEvent);
    };
  }, []);

  const toggle = () => {
    const next: AnimeNameLanguage = lang === "EN" ? "JP" : "EN";
    setStoredLanguage(next);
  };

  return [lang, toggle];
}
