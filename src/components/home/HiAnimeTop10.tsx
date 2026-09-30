"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Subtitles, Mic } from "lucide-react";
import { Anime } from "@/lib/anilist/types";
import { getPreferredTitle } from "@/lib/utils/title";
import { cn } from "@/lib/utils";
import { AnimeHoverPreview } from "@/components/anime/AnimeHoverPreview";
import { getEpisodeCounts } from "@/lib/utils/episodes";

export function HiAnimeTop10({ animeList }: { animeList: Anime[] }) {
  const [activeTab, setActiveTab] = useState<"Today" | "Week" | "Month">("Today");

  const list = animeList.slice(0, 10);

  return (
    <div className="w-full bg-[#13151b] rounded-lg border border-white/5 p-4 flex flex-col gap-3 select-none my-4">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <h3 className="text-base font-black text-white">Top 10</h3>

        <div className="flex items-center rounded bg-[#181a24] p-0.5 border border-white/5 text-[11px] font-bold">
          {(["Today", "Week", "Month"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-2 py-0.5 rounded transition-all cursor-pointer",
                activeTab === tab
                  ? "bg-[#ff2f6d] text-white shadow-sm"
                  : "text-white/60 hover:text-white"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 10 Ranked Items */}
      <div className="flex flex-col divide-y divide-white/5">
        {list.map((item, index) => {
          const title = getPreferredTitle(item.title);
          const counts = getEpisodeCounts(item);
          const rankStr = String(index + 1).padStart(2, "0");
          const isTop3 = index < 3;

          return (
            <div key={item.id} className="group relative">
              <AnimeHoverPreview anime={item} side="left" />
              <Link
              href={`/anime/${item.id}/details`}
              className="py-2.5 flex items-center gap-3 group hover:bg-white/5 -mx-2 px-2 rounded transition-colors"
            >
              {/* Rank Number */}
              <span
                className={cn(
                  "font-mono text-sm font-black w-6 text-center shrink-0",
                  index === 0
                    ? "text-[#ff2f6d]"
                    : isTop3
                    ? "text-white/90"
                    : "text-white/40"
                )}
              >
                {rankStr}
              </span>

              {/* Poster Thumbnail */}
              <div className="relative w-11 h-14 rounded overflow-hidden bg-[#161822] shrink-0 shadow-sm">
                <Image
                  src={item.coverImage}
                  alt={title}
                  fill
                  sizes="44px"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>

              {/* Info */}
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white group-hover:text-[#ff2f6d] transition-colors truncate">
                  {title}
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
    </div>
  );
}
