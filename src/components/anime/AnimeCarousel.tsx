"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Anime } from "@/lib/anilist/types";
import { AnimeCard } from "./AnimeCard";
import { AnimeCardSkeleton } from "../ui/Skeleton";

interface AnimeCarouselProps {
  title: string;
  items?: Anime[];
  isLoading?: boolean;
  seeAllHref?: string;
  showRank?: boolean;
}

export function AnimeCarousel({
  title,
  items = [],
  isLoading = false,
  seeAllHref,
  showRank = false,
}: AnimeCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!containerRef.current) return;
    const offset = containerRef.current.clientWidth * 0.75;
    containerRef.current.scrollBy({
      left: direction === "left" ? -offset : offset,
      behavior: "smooth",
    });
  };

  return (
    <section className="w-full flex flex-col gap-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-[#F5F7FA] tracking-tight">{title}</h2>

        <div className="flex items-center gap-3">
          {seeAllHref && (
            <Link
              href={seeAllHref}
              className="text-xs md:text-sm font-semibold text-[#9CA3AF] hover:text-[#7657FF] transition-colors flex items-center gap-1 group"
            >
              <span>See All</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}

          {/* Desktop Arrow Controls */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className="w-7 h-7 rounded-full bg-[#11151B] border border-white/10 hover:border-white/20 text-[#9CA3AF] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="w-7 h-7 rounded-full bg-[#11151B] border border-white/10 hover:border-white/20 text-[#9CA3AF] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2 pt-1"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-[140px] sm:w-[170px] md:w-[190px] lg:w-[205px]"
              >
                <AnimeCardSkeleton />
              </div>
            ))
          : items.map((anime, index) => (
              <div
                key={anime.id || index}
                className="shrink-0 w-[140px] sm:w-[170px] md:w-[190px] lg:w-[205px]"
                style={{ scrollSnapAlign: "start" }}
              >
                <AnimeCard anime={anime} showRank={showRank} />
              </div>
            ))}
      </div>
    </section>
  );
}
