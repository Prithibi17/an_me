"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Subtitles, Mic, ChevronRight } from "lucide-react";
import { Anime } from "@/lib/anilist/types";
import { useAnimeNameLanguage } from "@/lib/storage/language";
import { getPreferredTitle } from "@/lib/utils/title";

import { UpcomingCountdown } from "@/components/common/UpcomingCountdown";
import { AnimeHoverPreview } from "@/components/anime/AnimeHoverPreview";
import { getEpisodeCounts } from "@/lib/utils/episodes";

interface AnimeSectionGridProps {
  title: string;
  items: Anime[];
  viewMoreHref: string;
  isLatestSection?: boolean;
  isUpcomingSection?: boolean;
}

export function AnimeSectionGrid({
  title,
  items,
  viewMoreHref,
  isLatestSection = false,
  isUpcomingSection = false,
}: AnimeSectionGridProps) {
  const [lang] = useAnimeNameLanguage();
  if (!items || items.length === 0) return null;

  const list = items.slice(0, 12);

  return (
    <div className="w-full flex flex-col gap-4 select-none my-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg sm:text-xl font-black text-white">{title}</h3>
        <Link
          href={viewMoreHref}
          className="flex items-center gap-1 text-xs font-bold text-white/50 hover:text-[#ff5c8a] transition-colors"
        >
          <span>View more</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 6-Column Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {list.map((item, index) => {
          const itemTitle = getPreferredTitle(item.title, lang);
          const isUpcoming = isUpcomingSection || item.status === "NOT_YET_RELEASED";
          const counts = getEpisodeCounts(item);

          // Calculate real latest released episode number
          const latestEp = counts.sub;

          // For latest section, directly link to the released episode
          const watchHref = isLatestSection && latestEp > 0
            ? `/anime/${item.id}?ep=${latestEp}`
            : `/anime/${item.id}/details`;
          const detailHref = `/anime/${item.id}/details`;

          return (
            <article key={item.id} className="group relative flex flex-col gap-1.5 transition-transform duration-200">
              <AnimeHoverPreview anime={item} side={index % 6 < 3 ? "right" : "left"} />
              {/* Poster Card */}
              <Link href={watchHref} className="relative block aspect-[3/4] w-full rounded-md overflow-hidden bg-[#161822] shadow-sm">
                <Image
                  src={item.coverImage}
                  alt={itemTitle}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Top Badge: HD or Status */}
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                  {isUpcoming ? (
                    <span className="px-1.5 py-0.5 rounded bg-[#ff5c8a]/90 text-white text-[9px] font-black uppercase tracking-wider">
                      Upcoming
                    </span>
                  ) : (
                    <span className="px-1 py-0.2 rounded bg-black/60 backdrop-blur-xs text-[9px] font-black text-white">
                      HD
                    </span>
                  )}
                </div>

                {/* Bottom Badges */}
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center gap-1 flex-wrap">
                  <>
                      <span
                        title={`${counts.sub} subtitle episodes available`}
                        className="px-1.5 py-0.5 rounded bg-[#22c55e]/90 text-black text-[9px] font-bold flex items-center gap-0.5"
                      >
                        <Subtitles className="w-2.5 h-2.5" />
                        <span>{counts.sub}</span>
                      </span>
                      <span
                        title={`${counts.dub} dub episodes available`}
                        className="px-1.5 py-0.5 rounded bg-[#06b6d4]/90 text-black text-[9px] font-bold flex items-center gap-0.5"
                      >
                        <Mic className="w-2.5 h-2.5" />
                        <span>{counts.dub}</span>
                      </span>
                      <span title="Total planned episodes" className="px-1.5 py-0.5 rounded bg-black/75 text-white text-[9px] font-bold">
                        {counts.total ?? "?"}
                      </span>
                    </>
                </div>
                {isUpcoming && (
                  <div className="absolute bottom-7 left-1.5 right-1.5 bg-black/75 backdrop-blur-xs px-1.5 py-0.5 rounded flex items-center justify-center">
                    <UpcomingCountdown nextAiringEpisode={item.nextAiringEpisode} compact />
                  </div>
                )}
              </Link>

              {/* Title & Format */}
              <div className="flex flex-col gap-0.5">
                <Link href={detailHref} className="text-xs font-bold text-white hover:text-[#ff5c8a] transition-colors truncate" title={`View details for ${itemTitle}`}>
                  {itemTitle}
                </Link>
                <div className="flex items-center gap-1.5 text-[10px] text-white/50 font-semibold">
                  <Link href={`/search?type=${encodeURIComponent(item.format || "TV")}`} className="hover:text-[#ff5c8a] transition-colors">
                    {item.format || "TV"}
                  </Link>
                  <span>•</span>
                  {isLatestSection && item.latestAiredEpisode ? (
                    <span className="text-[#22c55e] font-bold">
                      Episode {item.latestAiredEpisode}
                    </span>
                  ) : isUpcoming && item.nextAiringEpisode ? (
                    <span className="text-[#ff5c8a] font-bold">
                      Ep {item.nextAiringEpisode.episode}
                    </span>
                  ) : (
                    <span>{item.duration || 24}m</span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
