"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Subtitles, Mic, Plus, Check } from "lucide-react";
import { Anime } from "@/lib/anilist/types";
import { getPreferredTitle } from "@/lib/utils/title";
import { isAnimeInList, toggleAnimeInList } from "@/lib/storage/anime-list";
import { AnimeHoverPreview } from "@/components/anime/AnimeHoverPreview";
import { getEpisodeCounts } from "@/lib/utils/episodes";

export function MostPopularSidebar({ animeList }: { animeList: Anime[] }) {
  const [addedMap, setAddedMap] = useState<Record<number, boolean>>({});

  const handleToggle = (e: React.MouseEvent, item: Anime) => {
    e.preventDefault();
    e.stopPropagation();
    const status = toggleAnimeInList({
      animeId: item.id,
      title: getPreferredTitle(item.title),
      coverImage: item.coverImage,
      score: item.score,
      format: item.format,
      year: item.seasonYear,
    });
    setAddedMap((prev) => ({ ...prev, [item.id]: status }));
  };

  const list = animeList.slice(0, 10);

  return (
    <div className="w-full bg-[#13151b] rounded-lg border border-white/5 p-4 flex flex-col gap-3 select-none">
      <h3 className="text-base font-black text-white pb-2 border-b border-white/5">
        Most Popular
      </h3>

      <div className="flex flex-col divide-y divide-white/5">
        {list.map((item, index) => {
          const title = getPreferredTitle(item.title);
          const counts = getEpisodeCounts(item);
          const isAdded = addedMap[item.id] !== undefined ? addedMap[item.id] : isAnimeInList(item.id);

          return (
            <div key={item.id} className="group relative">
              <AnimeHoverPreview anime={item} side="left" />
              <Link
              href={`/anime/${item.id}/details`}
              className="py-2.5 flex items-center justify-between gap-3 group hover:bg-white/5 -mx-2 px-2 rounded transition-colors"
            >
              {/* Left: Thumbnail & Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-11 h-14 rounded overflow-hidden bg-[#161822] shrink-0 shadow-sm">
                  <Image
                    src={item.coverImage}
                    alt={title}
                    fill
                    sizes="44px"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>

                <div className="flex flex-col gap-1 min-w-0">
                  <h4 className="text-xs font-bold text-white group-hover:text-[#ff2f6d] transition-colors truncate">
                    {title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="px-1.5 py-0.2 rounded bg-[#22c55e]/20 text-[#4ade80] font-bold flex items-center gap-0.5">
                      <Subtitles className="w-2.5 h-2.5" />
                      <span>{counts.sub}</span>
                    </span>
                    {counts.dub > 0 && <span className="px-1.5 py-0.2 rounded bg-[#06b6d4]/20 text-[#22d3ee] font-bold flex items-center gap-0.5">
                      <Mic className="w-2.5 h-2.5" />
                      <span>{counts.dub}</span>
                    </span>}
                    <span className="px-1 py-0.2 rounded bg-white/10 text-white/70 font-bold">{counts.total ?? "?"}</span>
                    <span className="text-white/40 font-semibold">• {item.format || "TV"}</span>
                  </div>
                </div>
              </div>

              {/* Right: + Button */}
              <button
                onClick={(e) => handleToggle(e, item)}
                className="w-7 h-7 rounded bg-[#1f222d] hover:bg-[#ff2f6d] hover:text-white text-white/60 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                title={isAdded ? "Remove from list" : "Add to list"}
              >
                {isAdded ? <Check className="w-3.5 h-3.5 text-[#ff2f6d] group-hover:text-white" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
