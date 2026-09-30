"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Anime } from "@/lib/anilist/types";
import { getPreferredTitle } from "@/lib/utils/title";

export function HiAnimeTrendingStrip({ items }: { items: Anime[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -340 : 340;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const trendingList = items.slice(0, 10);

  return (
    <div className="w-full flex flex-col gap-3 select-none my-4">
      {/* Title & Arrows */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-black text-white">Trending</h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleScroll("left")}
            aria-label="Scroll left"
            className="w-7 h-7 rounded bg-[#161822] hover:bg-[#ff2f6d] text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll("right")}
            aria-label="Scroll right"
            className="w-7 h-7 rounded bg-[#161822] hover:bg-[#ff2f6d] text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Row */}
      <div
        ref={scrollRef}
        className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-2"
      >
        {trendingList.map((item, index) => {
          const title = getPreferredTitle(item.title);
          const rankStr = String(index + 1).padStart(2, "0");

          return (
            <div key={item.id} className="relative shrink-0">
              <Link
              href={`/anime/${item.id}/details`}
              className="relative flex w-[190px] sm:w-[210px] h-[260px] sm:h-[280px] overflow-hidden bg-[#13151b] border border-white/5 shadow-md"
            >
              {/* Left Strip with Rotated Vertical Text */}
              <div className="w-11 bg-[#161822] flex flex-col-reverse items-center justify-between py-2.5 shrink-0 border-r border-white/5">
                <span className="font-mono text-xl font-black text-[#ffabd3]">
                  {rankStr}
                </span>
                <span
                  className="[writing-mode:vertical-rl] rotate-180 block max-h-[205px] overflow-hidden whitespace-nowrap text-ellipsis text-sm font-bold text-white tracking-wide leading-none"
                  title={title}
                >
                  {title}
                </span>
              </div>

              {/* Right Poster Image */}
              <div className="relative flex-1 h-full overflow-hidden bg-[#0d0f15]">
                <Image
                  src={item.coverImage}
                  alt={title}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
