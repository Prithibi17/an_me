"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Search, Play } from "lucide-react";
import { Anime } from "@/lib/anilist/types";
import { EpisodeItem } from "@/lib/providers";
import { cn } from "@/lib/utils";

interface EpisodeSectionProps {
  anime: Anime;
  episodes: EpisodeItem[];
  currentEpisode: number;
  onSelectEpisode: (epNum: number) => void;
}

export function EpisodeSection({
  anime,
  episodes,
  currentEpisode,
  onSelectEpisode,
}: EpisodeSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeRangeIndex, setActiveRangeIndex] = useState(0);

  const BATCH_SIZE = 50;

  const ranges = useMemo(() => {
    const total = episodes.length;
    if (total <= BATCH_SIZE) return [];
    const count = Math.ceil(total / BATCH_SIZE);
    return Array.from({ length: count }, (_, i) => {
      const start = i * BATCH_SIZE + 1;
      const end = Math.min((i + 1) * BATCH_SIZE, total);
      return { start, end, label: start + "-" + end };
    });
  }, [episodes.length]);

  const filteredEpisodes = useMemo(() => {
    let list = episodes;

    if (ranges.length > 0 && !searchTerm.trim()) {
      const range = ranges[activeRangeIndex];
      list = list.filter((e) => e.number >= range.start && e.number <= range.end);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (e) =>
          String(e.number).includes(term) ||
          e.title.toLowerCase().includes(term)
      );
    }

    return list;
  }, [episodes, ranges, activeRangeIndex, searchTerm]);

  return (
    <div className="w-full flex flex-col gap-5 pt-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#F5F7FA]">
            {episodes.length} Episodes
          </span>

          {ranges.length > 0 && !searchTerm && (
            <div className="flex items-center gap-1.5 ml-2 overflow-x-auto no-scrollbar">
              {ranges.map((r, idx) => (
                <button
                  key={r.label}
                  onClick={() => setActiveRangeIndex(idx)}
                  className={cn(
                    "px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer",
                    activeRangeIndex === idx
                      ? "bg-[#7657FF] text-white"
                      : "bg-[#161B22] text-[#9CA3AF] hover:text-[#F5F7FA]"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search episodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-lg bg-[#11151B] border border-white/10 focus:border-[#7657FF] focus:outline-none text-xs text-[#F5F7FA] placeholder-[#6B7280]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredEpisodes.map((ep) => {
          const isActive = ep.number === currentEpisode;
          const hasEpisodeThumbnail = Boolean(ep.thumbnail);
          const thumbnail = ep.thumbnail || (ep.number % 3 === 0 ? anime.coverImage : anime.bannerImage || anime.coverImage);
          const fallbackPositionX = (ep.number * 29) % 101;
          const fallbackPositionY = 20 + ((ep.number * 17) % 61);

          return (
            <div
              key={ep.number}
              onClick={() => onSelectEpisode(ep.number)}
              className={cn(
                "group flex flex-col rounded-xl overflow-hidden bg-[#11151B] border transition-all duration-180 cursor-pointer text-left hover:-translate-y-0.5",
                isActive
                  ? "border-[#7657FF] shadow-md shadow-[#7657FF]/20"
                  : "border-white/5 hover:border-white/15"
              )}
            >
              <div className="relative w-full aspect-video bg-[#161B22] overflow-hidden">
                <Image
                  src={thumbnail}
                  alt={"Episode " + ep.number}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                  style={hasEpisodeThumbnail ? undefined : {
                    objectPosition: `${fallbackPositionX}% ${fallbackPositionY}%`,
                    transform: `scale(${1.08 + (ep.number % 4) * 0.04})${ep.number % 2 === 0 ? " scaleX(-1)" : ""}`,
                  }}
                />

                {!hasEpisodeThumbnail && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(${110 + (ep.number * 23) % 120}deg, rgba(8,10,13,.7), transparent 58%, rgba(118,87,255,.22))`,
                    }}
                  />
                )}

                <div
                  className={cn(
                    "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-[#7657FF] text-white flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>

                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-white font-mono text-xs font-bold border border-white/10">
                    EP {ep.number}
                  </span>
                </div>

                <div className="absolute bottom-2 right-2">
                  <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-[#9CA3AF] text-[10px] font-medium border border-white/10">
                    {ep.duration || 24}m
                  </span>
                </div>
              </div>

              <div className="p-3 flex flex-col gap-0.5">
                <h4
                  className={cn(
                    "text-xs md:text-sm font-semibold truncate transition-colors",
                    isActive ? "text-[#866DFF]" : "text-[#F5F7FA] group-hover:text-[#866DFF]"
                  )}
                >
                  {ep.title}
                </h4>
                <p className="text-[11px] text-[#9CA3AF]">
                  Episode {ep.number}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
