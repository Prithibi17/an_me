"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Subtitles,
  Mic,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter as FilterIcon,
  RotateCcw,
  Search,
} from "lucide-react";
import { Anime, AnimePageResult } from "@/lib/anilist/types";
import { getPreferredTitle } from "@/lib/utils/title";
import { cn } from "@/lib/utils";
import { AnimeHoverPreview } from "@/components/anime/AnimeHoverPreview";
import { getEpisodeCounts } from "@/lib/utils/episodes";

const ALL_GENRES = [
  "Action", "Action & Adventure", "Adult Cast", "Adventure", "Animation", "Anthropomorphic",
  "Avant Garde", "Award Winning", "Boys Love", "Cars", "Childcare", "Combat Sports",
  "Comedy", "Delinquents", "Dementia", "Demons", "Detective", "Drama", "Ecchi", "Fantasy",
  "Gag Humor", "Game", "Gore", "Gourmet", "Harem", "Historical", "Horror", "Isekai",
  "Iyashikei", "Josei", "Kids", "Magic", "Magical Sex Shift", "Mahou Shoujo", "Martial Arts",
  "Mecha", "Medical", "Military", "Music", "Mystery", "Mythology", "Organized Crime",
  "Otaku Culture", "Parody", "Performing Arts", "Pets", "Police", "Psychological", "Racing",
  "Reincarnation", "Romance", "Samurai", "School", "Sci-Fi", "Seinen", "Shoujo", "Shounen",
  "Space", "Sports", "Super Power", "Supernatural", "Survival", "Suspense", "Team Sports",
  "Thriller", "Time Travel", "Vampire", "Video Game", "Visual Arts", "Workplace"
];

interface HiAnimeFilterViewProps {
  initialData?: AnimePageResult;
  initialParams?: { [key: string]: string | undefined };
}

export function HiAnimeFilterView({ initialData, initialParams = {} }: HiAnimeFilterViewProps) {
  const router = useRouter();

  // Read params from initialParams props (SSR friendly, zero bailout)
  const initialType = initialParams.type || "All";
  const initialStatus = initialParams.status || "All";
  const initialRated = initialParams.rated || "All";
  const initialScore = initialParams.score || "All";
  const initialSeason = initialParams.season || "All";
  const initialLanguage = initialParams.language || "All";
  const initialSort = initialParams.sort || "Default";
  const initialGenres = initialParams.genres
    ? initialParams.genres.split(",").filter(Boolean)
    : [];
  const initialPage = parseInt(initialParams.page || "1", 10);
  const initialKeyword = initialParams.q || "";

  // Form State
  const [searchKeyword, setSearchKeyword] = useState(initialKeyword);
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [selectedRated, setSelectedRated] = useState(initialRated);
  const [selectedScore, setSelectedScore] = useState(initialScore);
  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenres);

  const [startYear, setStartYear] = useState(initialParams.sy || "");
  const [startMonth, setStartMonth] = useState(initialParams.sm || "");
  const [startDay, setStartDay] = useState(initialParams.sd || "");

  const [endYear, setEndYear] = useState(initialParams.ey || "");
  const [endMonth, setEndMonth] = useState(initialParams.em || "");
  const [endDay, setEndDay] = useState(initialParams.ed || "");

  // Sync state if initialParams changes (e.g. router push with new ?q=...)
  useEffect(() => {
    if (initialParams.q !== undefined) {
      setSearchKeyword(initialParams.q || "");
    }
    if (initialData?.media) {
      setResults(initialData.media);
      setPageInfo({
        total: initialData.pageInfo?.total || 0,
        perPage: initialData.pageInfo?.perPage || 24,
        currentPage: initialData.pageInfo?.currentPage || 1,
        lastPage: initialData.pageInfo?.lastPage || 1,
        hasNextPage: initialData.pageInfo?.hasNextPage || false,
      });
    }
  }, [initialParams.q, initialData]);

  // Results & Pagination State
  const [results, setResults] = useState<Anime[]>(initialData?.media || []);
  const [page, setPage] = useState(initialPage);
  const [pageInfo, setPageInfo] = useState({
    total: initialData?.pageInfo?.total || 0,
    perPage: initialData?.pageInfo?.perPage || 24,
    currentPage: initialData?.pageInfo?.currentPage || 1,
    lastPage: initialData?.pageInfo?.lastPage || 1,
    hasNextPage: initialData?.pageInfo?.hasNextPage || false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Toggle Genre Pill
  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  // Convert Sort label to AniList sort enum
  const getSortEnum = (s: string) => {
    switch (s) {
      case "Recently Added":
        return "START_DATE_DESC";
      case "Recently Updated":
        return "UPDATED_AT_DESC";
      case "Score":
        return "SCORE_DESC";
      case "Name A-Z":
        return "TITLE_ROMAJI";
      case "Most Watched":
        return "POPULARITY_DESC";
      case "Most Favorited":
        return "FAVOURITES_DESC";
      default:
        return "TRENDING_DESC";
    }
  };

  // Fetch from server API route
  const fetchFilteredData = useCallback(async (pageToLoad: number) => {
    setIsLoading(true);

    const params = new URLSearchParams();
    if (searchKeyword.trim()) params.set("q", searchKeyword.trim());
    if (selectedType !== "All") params.set("type", selectedType);
    if (selectedStatus !== "All") params.set("status", selectedStatus);
    if (selectedSeason !== "All") params.set("season", selectedSeason);
    if (selectedScore !== "All") params.set("score", selectedScore);
    if (selectedSort !== "Default") params.set("sort", getSortEnum(selectedSort));
    if (selectedGenres.length > 0) params.set("genres", selectedGenres.join(","));
    if (startYear) params.set("sy", startYear);
    if (startMonth) params.set("sm", startMonth);
    if (startDay) params.set("sd", startDay);
    if (endYear) params.set("ey", endYear);
    if (endMonth) params.set("em", endMonth);
    if (endDay) params.set("ed", endDay);
    params.set("page", pageToLoad.toString());

    try {
      const res = await fetch(`/api/anime/filter?${params.toString()}`);
      if (!res.ok) throw new Error("Filter request failed");
      const data: AnimePageResult = await res.json();

      setResults(data.media || []);
      setPageInfo({
        total: data.pageInfo?.total || 0,
        perPage: data.pageInfo?.perPage || 24,
        currentPage: data.pageInfo?.currentPage || pageToLoad,
        lastPage: data.pageInfo?.lastPage || 1,
        hasNextPage: data.pageInfo?.hasNextPage || false,
      });
      setPage(pageToLoad);
    } catch (err) {
      console.error("Filter request error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    searchKeyword,
    selectedType,
    selectedStatus,
    selectedSeason,
    selectedScore,
    selectedSort,
    selectedGenres,
    startYear,
    startMonth,
    startDay,
    endYear,
    endMonth,
    endDay,
  ]);

  // Handle Apply Filter Click
  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchFilteredData(1);

    // Sync to URL
    const params = new URLSearchParams();
    if (searchKeyword.trim()) params.set("q", searchKeyword.trim());
    if (selectedType !== "All") params.set("type", selectedType);
    if (selectedStatus !== "All") params.set("status", selectedStatus);
    if (selectedRated !== "All") params.set("rated", selectedRated);
    if (selectedScore !== "All") params.set("score", selectedScore);
    if (selectedSeason !== "All") params.set("season", selectedSeason);
    if (selectedLanguage !== "All") params.set("language", selectedLanguage);
    if (selectedSort !== "Default") params.set("sort", selectedSort);
    if (selectedGenres.length > 0) params.set("genres", selectedGenres.join(","));
    if (startYear) params.set("sy", startYear);
    if (startMonth) params.set("sm", startMonth);
    if (startDay) params.set("sd", startDay);
    if (endYear) params.set("ey", endYear);
    if (endMonth) params.set("em", endMonth);
    if (endDay) params.set("ed", endDay);

    router.replace(`/filter?${params.toString()}`, { scroll: false });
  };

  // Reset Filters
  const handleReset = () => {
    setSelectedType("All");
    setSelectedStatus("All");
    setSelectedRated("All");
    setSelectedScore("All");
    setSelectedSeason("All");
    setSelectedLanguage("All");
    setSelectedSort("Default");
    setSelectedGenres([]);
    setStartYear("");
    setStartMonth("");
    setStartDay("");
    setEndYear("");
    setEndMonth("");
    setEndDay("");
    setPage(1);

    router.replace("/filter", { scroll: false });

    // Fetch default
    fetch("/api/anime/filter?sort=TRENDING_DESC&page=1")
      .then((r) => r.json())
      .then((data) => {
        setResults(data.media || []);
        setPageInfo(data.pageInfo);
      })
      .catch((e) => console.error(e));
  };

  const goToPage = (p: number) => {
    if (p < 1 || p > pageInfo.lastPage || p === page) return;
    fetchFilteredData(p);
    window.scrollTo({ top: 350, behavior: "smooth" });
  };

  return (
    <div className="w-full min-h-screen bg-[#0a0b0e] text-[#F5F7FA] py-5 px-3 sm:px-6 lg:px-8 max-w-[1720px] mx-auto select-none">
      {/* 1. Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-white/50 mb-3">
        <Link href="/" className="hover:text-white transition-colors">
          Home
        </Link>
        <span>•</span>
        <span className="text-white/80 font-semibold">Filter</span>
      </div>

      {/* 2. Interactive Filter Box matching exact Reference Screenshot */}
      <div className="w-full rounded-2xl bg-[#13151b] border border-white/5 p-4 sm:p-6 shadow-2xl mb-8 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <FilterIcon className="w-4 h-4 text-[#ff5c8a]" />
            Filter
          </h2>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-white/50 hover:text-[#ff5c8a] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* Row 1: All 9 Filters matching Reference */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5 text-xs">
          {/* 1. Type */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-white/50">Type</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full h-8 px-2 rounded-lg bg-[#181a24] border border-white/5 text-white/90 text-xs focus:outline-none focus:border-[#ff5c8a]/50 cursor-pointer"
            >
              <option value="All">All</option>
              <option value="MOVIE">Movie</option>
              <option value="TV">TV</option>
              <option value="OVA">OVA</option>
              <option value="ONA">ONA</option>
              <option value="SPECIAL">Special</option>
              <option value="MUSIC">Music</option>
            </select>
          </div>

          {/* 2. Status */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-white/50">Status</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-8 px-2 rounded-lg bg-[#181a24] border border-white/5 text-white/90 text-xs focus:outline-none focus:border-[#ff5c8a]/50 cursor-pointer"
            >
              <option value="All">All</option>
              <option value="FINISHED">Finished</option>
              <option value="RELEASING">Currently Airing</option>
              <option value="NOT_YET_RELEASED">Not yet aired</option>
            </select>
          </div>

          {/* 3. Rated */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-white/50">Rated</span>
            <select
              value={selectedRated}
              onChange={(e) => setSelectedRated(e.target.value)}
              className="w-full h-8 px-2 rounded-lg bg-[#181a24] border border-white/5 text-white/90 text-xs focus:outline-none focus:border-[#ff5c8a]/50 cursor-pointer"
            >
              <option value="All">All</option>
              <option value="G">G</option>
              <option value="PG">PG</option>
              <option value="PG-13">PG-13</option>
              <option value="R">R</option>
              <option value="R+">R+</option>
            </select>
          </div>

          {/* 4. Score */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-white/50">Score</span>
            <select
              value={selectedScore}
              onChange={(e) => setSelectedScore(e.target.value)}
              className="w-full h-8 px-2 rounded-lg bg-[#181a24] border border-white/5 text-white/90 text-xs focus:outline-none focus:border-[#ff5c8a]/50 cursor-pointer"
            >
              <option value="All">All</option>
              <option value="(10) Masterpiece">(10) Masterpiece</option>
              <option value="(9) Great">(9) Great</option>
              <option value="(8) Very Good">(8) Very Good</option>
              <option value="(7) Good">(7) Good</option>
              <option value="(6) Fine">(6) Fine</option>
              <option value="(5) Average">(5) Average</option>
            </select>
          </div>

          {/* 5. Season */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-white/50">Season</span>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full h-8 px-2 rounded-lg bg-[#181a24] border border-white/5 text-white/90 text-xs focus:outline-none focus:border-[#ff5c8a]/50 cursor-pointer"
            >
              <option value="All">All</option>
              <option value="SPRING">Spring</option>
              <option value="SUMMER">Summer</option>
              <option value="FALL">Fall</option>
              <option value="WINTER">Winter</option>
            </select>
          </div>

          {/* 6. Language */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-white/50">Language</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full h-8 px-2 rounded-lg bg-[#181a24] border border-white/5 text-white/90 text-xs focus:outline-none focus:border-[#ff5c8a]/50 cursor-pointer"
            >
              <option value="All">All</option>
              <option value="SUB">SUB</option>
              <option value="DUB">DUB</option>
              <option value="SUB & DUB">SUB & DUB</option>
            </select>
          </div>

          {/* 7. Start Date: Year Month Day */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-white/50">Start Date</span>
            <div className="grid grid-cols-3 gap-1">
              <input
                type="text"
                placeholder="Year"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                className="w-full h-8 px-1 text-center rounded bg-[#181a24] border border-white/5 text-white text-[10px] focus:outline-none focus:border-[#ff5c8a]/50 placeholder-white/30"
              />
              <input
                type="text"
                placeholder="Month"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="w-full h-8 px-1 text-center rounded bg-[#181a24] border border-white/5 text-white text-[10px] focus:outline-none focus:border-[#ff5c8a]/50 placeholder-white/30"
              />
              <input
                type="text"
                placeholder="Day"
                value={startDay}
                onChange={(e) => setStartDay(e.target.value)}
                className="w-full h-8 px-1 text-center rounded bg-[#181a24] border border-white/5 text-white text-[10px] focus:outline-none focus:border-[#ff5c8a]/50 placeholder-white/30"
              />
            </div>
          </div>

          {/* 8. End Date: Year Month Day */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-white/50">End Date</span>
            <div className="grid grid-cols-3 gap-1">
              <input
                type="text"
                placeholder="Year"
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
                className="w-full h-8 px-1 text-center rounded bg-[#181a24] border border-white/5 text-white text-[10px] focus:outline-none focus:border-[#ff5c8a]/50 placeholder-white/30"
              />
              <input
                type="text"
                placeholder="Month"
                value={endMonth}
                onChange={(e) => setEndMonth(e.target.value)}
                className="w-full h-8 px-1 text-center rounded bg-[#181a24] border border-white/5 text-white text-[10px] focus:outline-none focus:border-[#ff5c8a]/50 placeholder-white/30"
              />
              <input
                type="text"
                placeholder="Day"
                value={endDay}
                onChange={(e) => setEndDay(e.target.value)}
                className="w-full h-8 px-1 text-center rounded bg-[#181a24] border border-white/5 text-white text-[10px] focus:outline-none focus:border-[#ff5c8a]/50 placeholder-white/30"
              />
            </div>
          </div>

          {/* 9. Sort */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-white/50">Sort</span>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="w-full h-8 px-2 rounded-lg bg-[#181a24] border border-white/5 text-white/90 text-xs focus:outline-none focus:border-[#ff5c8a]/50 cursor-pointer"
            >
              <option value="Default">Default</option>
              <option value="Recently Added">Recently Added</option>
              <option value="Recently Updated">Recently Updated</option>
              <option value="Score">Score</option>
              <option value="Name A-Z">Name A-Z</option>
              <option value="Most Watched">Most Watched</option>
              <option value="Most Favorited">Most Favorited</option>
            </select>
          </div>
        </div>

        {/* Row 2: Genre Pills Multi-select */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
          <span className="text-xs font-bold text-white">Genre</span>
          <div className="flex flex-wrap items-center gap-1.5 max-h-52 overflow-y-auto pr-1 no-scrollbar">
            {ALL_GENRES.map((g) => {
              const isSelected = selectedGenres.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap",
                    isSelected
                      ? "bg-[#ff5c8a] text-white shadow-sm shadow-[#ff5c8a]/30 font-bold"
                      : "bg-[#181a24] hover:bg-[#222533] text-white/70"
                  )}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button: Pink FILTER Button matching Reference */}
        <div className="pt-1">
          <button
            onClick={() => handleApplyFilter()}
            className="px-7 py-2 rounded-lg bg-[#ff5c8a] hover:bg-[#ff4377] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-[#ff5c8a]/25 cursor-pointer active:scale-95"
          >
            Filter
          </button>
        </div>
      </div>

      {/* 3. Filter Anime Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            Filter Anime
            {pageInfo.total > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-white/60">
                {pageInfo.total.toLocaleString()} titles
              </span>
            )}
          </h1>

          {searchKeyword && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#ff5c8a]/15 border border-[#ff5c8a]/30 text-xs text-white">
              <span className="text-white/60">Keyword:</span>
              <span className="font-bold text-[#ff5c8a]">"{searchKeyword}"</span>
              <button
                type="button"
                onClick={() => {
                  setSearchKeyword("");
                  router.push("/filter");
                }}
                className="hover:text-white ml-1 text-white/50 cursor-pointer"
                title="Clear keyword filter"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Results Grid: 6 Columns matching Reference */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 animate-pulse">
              <div className="w-full aspect-[3/4] rounded-xl bg-[#14161f]" />
              <div className="h-3.5 w-3/4 bg-[#181a24] rounded" />
              <div className="h-3 w-1/2 bg-[#181a24] rounded" />
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="w-full py-20 flex flex-col items-center justify-center gap-3 text-center bg-[#13151b] rounded-2xl border border-white/5">
          <Search className="w-10 h-10 text-white/20" />
          <h3 className="text-base font-bold text-white">No Anime Found</h3>
          <p className="text-xs text-white/50 max-w-sm">
            Try adjusting your filters, clearing genre selections, or resetting filters.
          </p>
          <button
            onClick={handleReset}
            className="mt-2 px-4 py-1.5 rounded-lg bg-[#ff5c8a] text-white text-xs font-bold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {results.map((anime, index) => {
            const title = getPreferredTitle(anime.title);
            const counts = getEpisodeCounts(anime);

            return (
              <div key={anime.id} className="group relative flex flex-col">
                <AnimeHoverPreview anime={anime} side={index % 6 < 3 ? "right" : "left"} />
                <Link
                  href={`/anime/${anime.id}/details`}
                  className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-[#161822] shadow-md border border-white/5 group-hover:border-[#ff5c8a]/50 transition-all duration-300"
                >
                  <Image
                    src={anime.coverImage}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Bottom Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0e]/95 via-transparent to-transparent opacity-85 group-hover:opacity-65 transition-opacity" />

                  {/* Badges on Bottom of Poster matching Reference */}
                  <div className="absolute bottom-2 inset-x-2 flex items-center gap-1 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded bg-[#22c55e]/25 text-[#4ade80] text-[10px] font-extrabold flex items-center gap-0.5 backdrop-blur-xs">
                      <Subtitles className="w-2.5 h-2.5" />
                      <span>{counts.sub}</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#06b6d4]/25 text-[#22d3ee] text-[10px] font-extrabold flex items-center gap-0.5 backdrop-blur-xs">
                      <Mic className="w-2.5 h-2.5" />
                      <span>{counts.dub}</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-black/60 text-white/80 text-[10px] font-bold backdrop-blur-xs">
                      {counts.total ?? "?"}
                    </span>
                  </div>
                </Link>

                {/* Card Title & Meta Info */}
                <div className="pt-2 flex flex-col gap-0.5">
                  <Link
                    href={`/anime/${anime.id}/details`}
                    title={title}
                    className="text-xs sm:text-sm font-bold text-white group-hover:text-[#ff5c8a] transition-colors truncate"
                  >
                    {title}
                  </Link>
                  <span className="text-[11px] text-white/40 font-medium">
                    {anime.format || "TV"} • {anime.duration || 24}m
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Pagination Controls matching HiAnime Circle Style */}
      {pageInfo.lastPage > 1 && (
        <div className="flex items-center justify-center gap-2 pt-12 pb-6 flex-wrap">
          {/* First Page */}
          <button
            onClick={() => goToPage(1)}
            disabled={page === 1}
            aria-label="First page"
            className="w-9 h-9 rounded-full bg-[#161822] hover:bg-[#222533] disabled:opacity-30 disabled:pointer-events-none text-white/80 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Prev Page */}
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
            className="w-9 h-9 rounded-full bg-[#161822] hover:bg-[#222533] disabled:opacity-30 disabled:pointer-events-none text-white/80 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Dynamic Page Buttons */}
          {Array.from({ length: Math.min(5, pageInfo.lastPage) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, pageInfo.lastPage - 4));
            const p = start + i;
            if (p > pageInfo.lastPage) return null;
            const isCurrent = p === page;

            return (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer",
                  isCurrent
                    ? "bg-[#ff5c8a] text-white shadow-md shadow-[#ff5c8a]/30 scale-105"
                    : "bg-[#161822] hover:bg-[#222533] text-white/80"
                )}
              >
                {p}
              </button>
            );
          })}

          {/* Next Page */}
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= pageInfo.lastPage}
            aria-label="Next page"
            className="w-9 h-9 rounded-full bg-[#161822] hover:bg-[#222533] disabled:opacity-30 disabled:pointer-events-none text-white/80 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last Page */}
          <button
            onClick={() => goToPage(pageInfo.lastPage)}
            disabled={page >= pageInfo.lastPage}
            aria-label="Last page"
            className="w-9 h-9 rounded-full bg-[#161822] hover:bg-[#222533] disabled:opacity-30 disabled:pointer-events-none text-white/80 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
