"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Play } from "lucide-react";
import { Anime } from "@/lib/anilist/types";
import { useAnimeNameLanguage } from "@/lib/storage/language";
import { getPreferredTitle } from "@/lib/utils/title";
import { formatScore } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { AnimeHoverPreview } from "./AnimeHoverPreview";

interface AnimeCardProps {
  anime: Anime;
  showRank?: boolean;
  priority?: boolean;
  className?: string;
}

export function AnimeCard({ anime, showRank = false, priority = false, className }: AnimeCardProps) {
  const [lang] = useAnimeNameLanguage();
  const title = getPreferredTitle(anime.title, lang);
  const score = formatScore(anime.score);
  const year = anime.seasonYear;
  const format = anime.format || "TV";
  const rankNumber = anime.rank ? String(anime.rank).padStart(2, "0") : null;

  return (
    <div className={cn("group relative", className)}>
      <AnimeHoverPreview anime={anime} />
      <Link
      href={`/anime/${anime.id}/details`}
      className={cn(
        "relative flex flex-col w-full text-left transition-transform duration-200 ease-out hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7657FF] rounded-lg"
      )}
    >
      {/* Poster Container (2:3 aspect ratio) */}
      <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-[#11151B] border border-white/5 shadow-md">
        <Image
          src={anime.coverImage}
          alt={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          priority={priority}
          className="object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
        />

        {/* Subtle Dark Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-[#7657FF] text-white flex items-center justify-center shadow-lg shadow-[#7657FF]/40 transform scale-90 group-hover:scale-100 transition-transform duration-180">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>

        {/* Ranking Badge (01, 02, etc.) */}
        {showRank && rankNumber && (
          <div className="absolute top-2 left-2 z-10">
            <span className="px-2 py-0.5 rounded bg-[#080A0D]/85 backdrop-blur-md text-white font-mono text-xs font-bold border border-white/10 tracking-wider">
              {rankNumber}
            </span>
          </div>
        )}

        {/* Rating Badge */}
        {anime.score && (
          <div className="absolute bottom-2 right-2 z-10">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#080A0D]/85 backdrop-blur-md text-[#F5C451] text-xs font-semibold border border-white/10">
              <Star className="w-3 h-3 fill-current" />
              {score}
            </span>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-2.5 flex flex-col gap-0.5">
        <h3
          title={title}
          className="text-sm md:text-base font-semibold text-[#F5F7FA] group-hover:text-[#866DFF] transition-colors duration-150 line-clamp-1 leading-snug"
        >
          {title}
        </h3>
        <p className="text-xs text-[#9CA3AF] flex items-center gap-1.5 font-medium">
          <span>{format}</span>
          {year && (
            <>
              <span className="text-white/20">•</span>
              <span>{year}</span>
            </>
          )}
        </p>
      </div>
      </Link>
    </div>
  );
}
