"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Subtitles, Mic, ChevronRight } from "lucide-react";
import { Anime } from "@/lib/anilist/types";
import { getPreferredTitle } from "@/lib/utils/title";
import { AnimeHoverPreview } from "@/components/anime/AnimeHoverPreview";
import { getEpisodeCounts } from "@/lib/utils/episodes";

interface FourColumnsProps {
  topAiring: Anime[];
  mostPopular: Anime[];
  mostFavorite: Anime[];
  latestCompleted: Anime[];
}

function ColumnBlock({
  title,
  items,
  viewMoreHref,
  previewSide,
}: {
  title: string;
  items: Anime[];
  viewMoreHref: string;
  previewSide: "left" | "right";
}) {
  const list = items.slice(0, 5);

  return (
    <div className="flex flex-col gap-3 bg-[#13151b] rounded-lg border border-white/5 p-4">
      {/* Title */}
      <h3 className="text-sm sm:text-base font-black text-white pb-1 border-b border-white/5">
        {title}
      </h3>

      {/* 5 Anime Items */}
      <div className="flex flex-col divide-y divide-white/5">
        {list.map((item) => {
          const itemTitle = getPreferredTitle(item.title);
          const counts = getEpisodeCounts(item);

          return (
            <div key={item.id} className="group relative">
              <AnimeHoverPreview anime={item} side={previewSide} />
              <Link
              href={`/anime/${item.id}/details`}
              className="py-2.5 flex items-center gap-3 group hover:bg-white/5 -mx-2 px-2 rounded transition-colors"
            >
              {/* Thumbnail */}
              <div className="relative w-11 h-14 rounded overflow-hidden bg-[#161822] shrink-0 shadow-sm">
                <Image
                  src={item.coverImage}
                  alt={itemTitle}
                  fill
                  sizes="44px"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>

              {/* Info */}
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white group-hover:text-[#ff5c8a] transition-colors truncate">
                  {itemTitle}
                </h4>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="px-1.5 py-0.2 rounded bg-[#22c55e]/20 text-[#4ade80] font-bold flex items-center gap-0.5">
                    <Subtitles className="w-2.5 h-2.5" />
                    <span>{counts.sub}</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-[#06b6d4]/20 text-[#22d3ee] font-bold flex items-center gap-0.5">
                    <Mic className="w-2.5 h-2.5" />
                    <span>{counts.dub}</span>
                  </span>
                  <span className="px-1 py-0.2 rounded bg-white/10 text-white/70 font-bold">{counts.total ?? "?"}</span>
                  <span className="text-white/40 font-semibold">• {item.format || "TV"}</span>
                </div>
              </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* View More Link */}
      <Link
        href={viewMoreHref}
        className="flex items-center gap-1 text-[11px] font-bold text-white/50 hover:text-[#ff5c8a] pt-1 transition-colors self-start cursor-pointer"
      >
        <span>View more</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

export function HiAnimeFourColumns({
  topAiring,
  mostPopular,
  mostFavorite,
  latestCompleted,
}: FourColumnsProps) {
  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none my-4">
      <ColumnBlock
        title="Top Airing"
        items={topAiring}
        viewMoreHref="/search?sort=POPULARITY_DESC&status=RELEASING"
        previewSide="right"
      />
      <ColumnBlock
        title="Most Popular"
        items={mostPopular}
        viewMoreHref="/search?sort=POPULARITY_DESC"
        previewSide="right"
      />
      <ColumnBlock
        title="Most Favorite"
        items={mostFavorite}
        viewMoreHref="/search?sort=SCORE_DESC"
        previewSide="left"
      />
      <ColumnBlock
        title="Latest Completed"
        items={latestCompleted}
        viewMoreHref="/search?sort=SCORE_DESC&status=FINISHED"
        previewSide="left"
      />
    </div>
  );
}
