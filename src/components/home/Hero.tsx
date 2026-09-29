"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Play, Info } from "lucide-react";
import { Anime } from "@/lib/anilist/types";
import { getPreferredTitle } from "@/lib/utils/title";
import { formatScore, formatDuration, cleanDescription } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface HeroProps {
  featured: Anime[];
}

export function Hero({ featured }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const animeList = featured.slice(0, 5);

  useEffect(() => {
    if (animeList.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % animeList.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [animeList.length, isPaused]);

  if (animeList.length === 0) return null;

  const current = animeList[currentIndex];
  const title = getPreferredTitle(current.title);
  const score = formatScore(current.score);
  const year = current.seasonYear || new Date().getFullYear();
  const format = current.format || "TV";
  const duration = formatDuration(current.duration);
  const description = cleanDescription(current.description);
  const genres = current.genres.slice(0, 3).join(" • ");
  const backdrop = current.bannerImage || current.coverImage;

  return (
    <section
      className="relative w-full h-[540px] sm:h-[580px] lg:h-[660px] overflow-hidden select-none bg-[#080A0D]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Slides with Crossfade */}
      {animeList.map((anime, idx) => {
        const bgImg = anime.bannerImage || anime.coverImage;
        const isActive = idx === currentIndex;
        return (
          <div
            key={anime.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-in-out",
              isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            )}
          >
            <Image
              src={bgImg}
              alt={getPreferredTitle(anime.title)}
              fill
              priority={idx === 0}
              className="object-cover object-center lg:object-right"
              sizes="100vw"
            />
          </div>
        );
      })}

      {/* Cinematic Gradient Overlays to Guarantee Text Readability */}
      {/* Left to right overlay */}
      <div className="absolute inset-0 z-20 bg-gradient-to-r from-[#080A0D] via-[#080A0D]/85 to-transparent md:w-[75%] lg:w-[60%]" />
      {/* Bottom to top overlay */}
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#080A0D] via-[#080A0D]/50 to-transparent" />
      {/* Top subtle shade for navbar contrast */}
      <div className="absolute inset-x-0 top-0 h-32 z-20 bg-gradient-to-b from-[#080A0D]/90 to-transparent" />

      {/* Hero Content */}
      <div className="relative z-30 h-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 lg:pb-20">
        <div className="max-w-xl lg:max-w-2xl flex flex-col gap-3">
          {/* Badge */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-[#7657FF]/20 border border-[#7657FF]/40 text-[#866DFF] text-xs font-bold tracking-wider uppercase">
              #{currentIndex + 1} Trending
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F5F7FA] tracking-tight leading-[1.1] line-clamp-2">
            {title}
          </h1>

          {/* Metadata info line */}
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm font-medium text-[#9CA3AF]">
            {current.score && (
              <>
                <span className="flex items-center gap-1 text-[#F5C451] font-semibold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {score}
                </span>
                <span className="text-white/20">•</span>
              </>
            )}
            <span>{year}</span>
            <span className="text-white/20">•</span>
            <span>{format}</span>
            <span className="text-white/20">•</span>
            <span>{duration}</span>
          </div>

          {/* Genres */}
          {genres && (
            <p className="text-xs md:text-sm font-medium text-[#7657FF]">
              {genres}
            </p>
          )}

          {/* Description */}
          {description && (
            <p className="text-xs md:text-sm text-[#9CA3AF] line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-lg mt-0.5">
              {description}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Link
              href={"/anime/" + current.id + "?watch=1"}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#7657FF] hover:bg-[#866DFF] text-white font-semibold text-sm transition-all shadow-md shadow-[#7657FF]/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Watch Now</span>
            </Link>

            <Link
              href={`/anime/${current.id}/details`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#161B22]/90 hover:bg-[#1f2630] border border-white/10 hover:border-white/20 text-[#F5F7FA] font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Info className="w-4 h-4 text-[#9CA3AF]" />
              <span>More Info</span>
            </Link>
          </div>
        </div>

        {/* Carousel Indicators: ━━  •  •  • */}
        <div className="absolute bottom-6 right-4 sm:right-8 z-30 flex items-center gap-2">
          {animeList.map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={"Slide " + (idx + 1)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                  isActive
                    ? "w-8 bg-[#7657FF]"
                    : "w-2 bg-white/25 hover:bg-white/50"
                )}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
