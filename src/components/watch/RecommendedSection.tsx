"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Subtitles, Mic } from "lucide-react";
import { Anime } from "@/lib/anilist/types";
import { getPreferredTitle } from "@/lib/utils/title";
import { AnimeHoverPreview } from "@/components/anime/AnimeHoverPreview";
import { getEpisodeCounts } from "@/lib/utils/episodes";

export function RecommendedSection({
  recommendations,
}: {
  recommendations?: Anime[];
}) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const items = recommendations.slice(0, 12);

  return (
    <div className="w-full flex flex-col gap-4 select-none mt-6">
      <h3 className="text-base font-black text-white">Recommended For You</h3>

      {/* Grid of anime cards matching HiAnime */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {items.map((item, index) => {
          const title = getPreferredTitle(item.title);
          const counts = getEpisodeCounts(item);

          return (
            <div key={item.id} className="group relative flex flex-col gap-1.5 transition-transform duration-200">
              <AnimeHoverPreview anime={item} side={index % 6 < 3 ? "right" : "left"} />
              <Link
              href={`/anime/${item.id}/details`}
              className="flex flex-col gap-1.5"
            >
              {/* Poster with badges */}
              <div className="relative aspect-[3/4] w-full rounded-md overflow-hidden bg-[#161822] shadow-sm">
                <Image
                  src={item.coverImage}
                  alt={title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Top 18+ or HD badge if any */}
                <div className="absolute top-1.5 left-1.5">
                  <span className="px-1 py-0.2 rounded bg-amber-500/90 text-[9px] font-black text-black">
                    18+
                  </span>
                </div>

                {/* Bottom badges: SUB & DUB counts */}
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-[#22c55e]/90 text-black text-[9px] font-bold flex items-center gap-0.5">
                    <Subtitles className="w-2.5 h-2.5" />
                    <span>{counts.sub}</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#06b6d4]/90 text-black text-[9px] font-bold flex items-center gap-0.5">
                    <Mic className="w-2.5 h-2.5" />
                    <span>{counts.dub}</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-black/75 text-white text-[9px] font-bold">
                    {counts.total ?? "?"}
                  </span>
                </div>
              </div>

              {/* Title & Format */}
              <div className="flex flex-col gap-0.5">
                <h4 className="text-xs font-bold text-white group-hover:text-[#ff5c8a] transition-colors truncate">
                  {title}
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] text-white/50 font-semibold">
                  <span>{item.format || "TV"}</span>
                  <span>•</span>
                  <span>{item.duration || 24}m</span>
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
