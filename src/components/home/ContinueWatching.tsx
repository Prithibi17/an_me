"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { useWatchHistory } from "@/hooks/useWatchHistory";

export function ContinueWatching() {
  const { history, isLoading } = useWatchHistory();

  if (isLoading || history.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl md:text-2xl font-bold text-[#F5F7FA] tracking-tight">
          Continue Watching
        </h2>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2">
        {history.slice(0, 10).map((item) => {
          const percent =
            item.duration > 0
              ? Math.min(100, Math.round((item.currentTime / item.duration) * 100))
              : 0;

          return (
            <Link
              key={item.animeId}
              href={"/anime/" + item.animeId + "?watch=1&ep=" + item.episode}
              className="group shrink-0 w-[240px] sm:w-[280px] flex flex-col gap-2 rounded-lg text-left transition-transform duration-200 hover:-translate-y-1"
            >
              {/* Landscape Artwork Thumbnail */}
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-[#11151B] border border-white/5 shadow-md">
                <Image
                  src={item.bannerImage || item.coverImage}
                  alt={item.animeTitle}
                  fill
                  sizes="280px"
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                />

                {/* Dark Vignette */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-[#7657FF] text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Progress Bar at Bottom of Thumbnail */}
                <div className="absolute bottom-0 inset-x-0 h-1 bg-black/60">
                  <div
                    className="h-full bg-[#7657FF] transition-all"
                    style={{ width: percent + "%" }}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-[#F5F7FA] truncate group-hover:text-[#866DFF] transition-colors">
                    {item.animeTitle}
                  </h3>
                  <p className="text-xs text-[#9CA3AF] truncate">
                    Episode {item.episode}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#7657FF] shrink-0">
                  {percent}%
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
