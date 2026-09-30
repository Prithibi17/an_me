"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { Anime } from "@/lib/anilist/types";
import { cn } from "@/lib/utils";

interface NavbarSearchProps {
  langPreference?: "EN" | "JP";
  className?: string;
  onCloseMobile?: () => void;
}

export function NavbarSearch({
  langPreference = "EN",
  className,
  onCloseMobile,
}: NavbarSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Fetch suggestions with debouncing & cancellation
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/anime/filter?q=${encodeURIComponent(trimmed)}&perPage=6`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Search suggestion request failed");
        const data = await res.json();
        setSuggestions(data.media || []);
        setSelectedIndex(-1);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Suggestion error:", err);
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();

    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      const selected = suggestions[selectedIndex];
      setIsOpen(false);
      if (onCloseMobile) onCloseMobile();
      router.push(`/anime/${selected.id}/details`);
      return;
    }

    setIsOpen(false);
    if (onCloseMobile) onCloseMobile();
    if (trimmed) {
      router.push(`/filter?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/filter");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen && suggestions.length > 0) {
        setIsOpen(true);
        return;
      }
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
      return;
    }

    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  const handleViewAll = () => {
    const trimmed = query.trim();
    setIsOpen(false);
    if (onCloseMobile) onCloseMobile();
    if (trimmed) {
      router.push(`/filter?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/filter");
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form
        onSubmit={handleSearchSubmit}
        className="relative flex items-center w-full"
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Search anime..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 1) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full h-9 pl-3.5 pr-20 rounded-md bg-[#1d1f27] border border-transparent focus:border-[#ff2f6d]/50 focus:outline-none text-xs text-[#F5F7FA] placeholder-white/40 transition-colors"
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          {isLoading ? (
            <div className="p-1.5 text-[#ff2f6d]" title="Searching...">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </div>
          ) : (
            <button
              type="submit"
              className="p-1.5 text-white/60 hover:text-white transition-colors cursor-pointer"
              title="Search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              if (onCloseMobile) onCloseMobile();
              router.push("/filter");
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#2b2d38] hover:bg-[#353846] text-[10px] font-semibold text-white/80 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-2.5 h-2.5" />
            <span>Filter</span>
          </button>
        </div>
      </form>

      {/* Dropdown Suggestions */}
      {isOpen && query.trim().length >= 1 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#14161f] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {isLoading && suggestions.length === 0 ? (
            <div className="p-4 text-center text-xs text-white/50 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#ff2f6d]" />
              <span>Searching for &ldquo;{query}&rdquo;...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="divide-y divide-white/5">
              <div className="max-h-[390px] overflow-y-auto">
                {suggestions.map((anime, idx) => {
                  const title =
                    langPreference === "EN"
                      ? anime.title.english || anime.title.romaji || "Unknown"
                      : anime.title.romaji || anime.title.english || "Unknown";
                  const altTitle =
                    langPreference === "EN"
                      ? anime.title.romaji
                      : anime.title.english;
                  const isSelected = selectedIndex === idx;

                  return (
                    <Link
                      key={anime.id}
                      href={`/anime/${anime.id}/details`}
                      onClick={() => {
                        setIsOpen(false);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={cn(
                        "flex items-center gap-3 p-2.5 hover:bg-white/5 transition-colors group cursor-pointer",
                        isSelected && "bg-white/10"
                      )}
                    >
                      {/* Poster thumbnail */}
                      <div className="relative w-11 h-14 sm:w-12 sm:h-16 shrink-0 rounded overflow-hidden bg-black/40">
                        {anime.coverImage ? (
                          <Image
                            src={anime.coverImage}
                            alt={title}
                            fill
                            sizes="48px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#20222e]" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-white group-hover:text-[#ff2f6d] transition-colors truncate">
                          {title}
                        </div>

                        {altTitle && altTitle !== title && (
                          <div className="text-[11px] text-white/40 truncate">
                            {altTitle}
                          </div>
                        )}

                        {/* Meta badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-white/60">
                          {anime.format && (
                            <span className="px-1.5 py-0.5 rounded bg-white/10 font-bold text-white/80">
                              {anime.format}
                            </span>
                          )}
                          {anime.episodes ? (
                            <span>{anime.episodes} eps</span>
                          ) : anime.status === "RELEASING" ? (
                            <span className="text-emerald-400 font-medium">Releasing</span>
                          ) : null}
                          {anime.seasonYear && (
                            <>
                              <span>•</span>
                              <span>{anime.seasonYear}</span>
                            </>
                          )}
                          {anime.score ? (
                            <>
                              <span>•</span>
                              <span className="text-amber-400 font-bold">
                                ★ {(anime.score / 10).toFixed(1)}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* View all results bottom banner */}
              <button
                type="button"
                onClick={handleViewAll}
                className="w-full py-2.5 px-3 bg-[#ff2f6d]/10 hover:bg-[#ff2f6d] text-[#ff2f6d] hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer group"
              >
                <span>View all results for &ldquo;{query}&rdquo;</span>
                <span className="group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </button>
            </div>
          ) : (
            <div className="p-4 text-center">
              <div className="text-xs text-white/60">
                No anime found for &ldquo;{query}&rdquo;
              </div>
              <button
                type="button"
                onClick={handleViewAll}
                className="mt-2 text-[11px] text-[#ff2f6d] hover:underline cursor-pointer"
              >
                Search all in filter page →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
