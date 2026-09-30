"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Play, Check, Plus, ChevronRight } from "lucide-react";
import { Anime } from "@/lib/anilist/types";
import { useAnimeList } from "@/hooks/useAnimeList";
import { getPreferredTitle, getSubtitle } from "@/lib/utils/title";
import { formatScore, formatDuration, cleanDescription } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";

interface AnimeHeroProps {
  anime: Anime;
  currentEpisode?: number;
  onWatchClick: () => void;
}

export function AnimeHero({ anime, currentEpisode = 1, onWatchClick }: AnimeHeroProps) {
  const title = getPreferredTitle(anime.title);
  const subtitle = getSubtitle(anime.title);
  const score = formatScore(anime.score);
  const year = anime.seasonYear || anime.season;
  const format = anime.format || "TV";
  const duration = formatDuration(anime.duration);
  const genres = anime.genres.join(" • ");
  const description = cleanDescription(anime.description);
  const backdrop = anime.bannerImage || anime.coverImage;

  const { inList, toggle } = useAnimeList(anime.id);

  const handleToggleList = () => {
    toggle({
      animeId: anime.id,
      title,
      coverImage: anime.coverImage,
      score: anime.score,
      format: anime.format,
      year: anime.seasonYear,
    });
  };

  return (
    <section className="relative w-full min-h-[460px] md:min-h-[520px] overflow-hidden select-none bg-[#080A0D]">
      <div className="absolute inset-0 z-0">
        <Image
          src={backdrop}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-40 md:opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080A0D] via-[#080A0D]/70 to-[#080A0D]/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080A0D] via-[#080A0D]/60 to-transparent" />
      </div>

      <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 md:pb-12 flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-end">
        <div className="relative w-36 sm:w-44 md:w-56 shrink-0 aspect-[2/3] rounded-xl overflow-hidden bg-[#11151B] border border-white/10 shadow-2xl">
          <Image
            src={anime.coverImage}
            alt={title}
            fill
            priority
            sizes="(max-width: 768px) 180px, 240px"
            className="object-cover"
          />
        </div>

        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-white/55 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-white/30" />
            <Link href={`/search?type=${encodeURIComponent(format)}`} className="hover:text-white transition-colors">{format}</Link>
            <ChevronRight className="w-3 h-3 text-white/30" />
            <span className="text-white/80 truncate max-w-[280px] sm:max-w-md">{title}</span>
          </nav>

          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#F5F7FA] tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && (
              <h2 className="text-xs sm:text-sm text-[#9CA3AF] font-medium mt-1">
                {subtitle}
              </h2>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {anime.status && (
              <span className="px-2.5 py-0.5 rounded bg-[#7c3cff]/20 border border-[#7c3cff]/40 text-[#9066ff] text-xs font-bold uppercase tracking-wider">
                {anime.status}
              </span>
            )}
            {anime.season && anime.seasonYear && (
              <span className="px-2.5 py-0.5 rounded bg-[#161B22] border border-white/10 text-[#9CA3AF] text-xs font-medium">
                {anime.season} {anime.seasonYear}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm font-medium text-[#9CA3AF]">
            {anime.score && (
              <>
                <span className="flex items-center gap-1 text-[#F5C451] font-semibold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {score}
                </span>
                <span className="text-white/20">•</span>
              </>
            )}
            {year && <span>{year}</span>}
            <span className="text-white/20">•</span>
            <span>{format}</span>
            <span className="text-white/20">•</span>
            <span>{duration}</span>
          </div>

          {genres && (
            <p className="text-xs md:text-sm font-medium text-[#7c3cff]">
              {genres}
            </p>
          )}

          {description && (
            <p className="text-xs md:text-sm text-[#9CA3AF] line-clamp-3 leading-relaxed max-w-2xl">
              {description}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              icon={<Play className="w-4 h-4 fill-current ml-0.5" />}
              onClick={onWatchClick}
            >
              Continue - Ep {currentEpisode}
            </Button>

            <Button
              variant={inList ? "outline" : "secondary"}
              size="lg"
              icon={inList ? <Check className="w-4 h-4 text-[#48C78E]" /> : <Plus className="w-4 h-4" />}
              onClick={handleToggleList}
            >
              {inList ? "In My List" : "Add to List"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
