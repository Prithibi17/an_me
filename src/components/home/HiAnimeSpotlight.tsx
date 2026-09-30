"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, ChevronLeft, ChevronRight, Subtitles, Mic, Calendar, Clock } from "lucide-react";
import { Anime } from "@/lib/anilist/types";
import { useAnimeNameLanguage } from "@/lib/storage/language";
import { getPreferredTitle } from "@/lib/utils/title";
import { getEpisodeCounts } from "@/lib/utils/episodes";

const PROPER_BANNER_OVERRIDES: Record<number, string> = {
  // Mushoku Tensei Season 3 -> use official high-res landscape franchise banner instead of hair slice
  178789: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/108465-RgsRpTMhP9Sv.jpg",
  217434: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/108465-RgsRpTMhP9Sv.jpg",
};

export function HiAnimeSpotlight({ spotlightList }: { spotlightList: Anime[] }) {
  const [lang] = useAnimeNameLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const list = spotlightList.slice(0, 10);

  useEffect(() => {
    if (isPaused || list.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % list.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, list.length]);

  if (list.length === 0) return null;

  const current = list[currentIndex];
  const title = getPreferredTitle(current.title, lang);
  const counts = getEpisodeCounts(current);
  const bannerUrl =
    PROPER_BANNER_OVERRIDES[current.id] ||
    current.bannerImage ||
    current.coverImage;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + list.length) % list.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % list.length);
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-[380px] sm:h-[440px] md:h-[480px] lg:h-[520px] overflow-hidden bg-[#0d0f15] select-none"
    >
      {/* Full Hero Landscape Banner */}
      <div className="absolute inset-0 pointer-events-none">
        <Image
          src={bannerUrl}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-right md:object-center opacity-75 md:opacity-85 transition-opacity duration-700 ease-in-out"
        />
        {/* Cinematic dark gradients on left and bottom for crisp readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0b0e] via-[#0a0b0e]/85 md:via-[#0a0b0e]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0e] via-transparent to-[#0a0b0e]/30" />
      </div>

      {/* Foreground Content: Text on Left (No poster, wide banner only) */}
      <div className="relative z-10 w-full h-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
        {/* Left Side: Info & Actions */}
        <div className="max-w-xl lg:max-w-2xl flex flex-col gap-3 py-6">
          {/* Spotlight Rank */}
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-extrabold text-[#ff2f6d] tracking-wide">
              #{currentIndex + 1} Spotlight
            </span>
          </div>

          {/* Large Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight line-clamp-2 drop-shadow-md">
            {title}
          </h1>

          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/80 pt-1">
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/90 text-[11px] font-bold">
              {current.format || "TV"}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#ff2f6d]/20 text-[#ff2f6d] text-[11px] font-extrabold">
              HD
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#22c55e]/20 text-[#4ade80] text-[11px] font-bold flex items-center gap-1">
              <Subtitles className="w-3 h-3" />
              <span>{counts.sub}</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#06b6d4]/20 text-[#22d3ee] text-[11px] font-bold flex items-center gap-1">
              <Mic className="w-3 h-3" />
              <span>{counts.dub}</span>
            </span>
            <span className="flex items-center gap-1 text-white/50 text-[11px] ml-1">
              <Clock className="w-3 h-3" />
              <span>{current.duration || 24}m</span>
            </span>
            <span className="flex items-center gap-1 text-white/50 text-[11px]">
              <Calendar className="w-3 h-3" />
              <span>{current.seasonYear || 2024}</span>
            </span>
          </div>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-white/70 line-clamp-3 leading-relaxed max-w-xl">
            {current.description
              ? current.description.replace(/<[^>]*>/g, "")
              : "Discover this captivating anime series on An:me in high-definition streaming."}
          </p>

          {/* Buttons: Watch Now & Detail */}
          <div className="flex items-center gap-3 pt-2">
            {counts.sub > 0 ? (
              <Link
                href={`/anime/${current.id}?ep=${counts.sub}`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ff2f6d] hover:bg-[#e9235e] text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-[#ff2f6d]/30 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Watch Now</span>
              </Link>
            ) : (
              <span className="px-5 py-2.5 rounded-full bg-white/10 text-white/60 text-xs sm:text-sm font-bold">Schedule not announced</span>
            )}

            <Link
              href={`/anime/${current.id}/details`}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#1e2029] hover:bg-[#2b2d3a] text-white/90 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <span>Detail</span>
              <ChevronRight className="w-4 h-4 text-white/50" />
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Arrows (Bottom Right) */}
      <div className="absolute right-4 sm:right-8 bottom-6 z-20 flex items-center gap-2">
        <button
          onClick={handlePrev}
          aria-label="Previous Spotlight"
          className="w-9 h-9 rounded-md bg-[#161822]/80 hover:bg-[#ff2f6d] text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-sm border border-white/10"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handleNext}
          aria-label="Next Spotlight"
          className="w-9 h-9 rounded-md bg-[#161822]/80 hover:bg-[#ff2f6d] text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-sm border border-white/10"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
