"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_GENRES = [
  { name: "Action", color: "hover:text-[#ff2f6d]" },
  { name: "Adventure", color: "hover:text-[#38bdf8]" },
  { name: "Cars", color: "hover:text-[#4ade80]" },
  { name: "Comedy", color: "hover:text-[#facc15]" },
  { name: "Dementia", color: "hover:text-[#c084fc]" },
  { name: "Demons", color: "hover:text-[#f87171]" },
  { name: "Drama", color: "hover:text-[#fb923c]" },
  { name: "Ecchi", color: "hover:text-[#f472b6]" },
  { name: "Fantasy", color: "hover:text-[#60a5fa]" },
  { name: "Game", color: "hover:text-[#34d399]" },
  { name: "Harem", color: "hover:text-[#fb7185]" },
  { name: "Historical", color: "hover:text-[#a3e635]" },
  { name: "Horror", color: "hover:text-[#ef4444]" },
  { name: "Isekai", color: "hover:text-[#a855f7]" },
  { name: "Josei", color: "hover:text-[#e879f9]" },
  { name: "Kids", color: "hover:text-[#2dd4bf]" },
  { name: "Magic", color: "hover:text-[#818cf8]" },
  { name: "Martial Arts", color: "hover:text-[#f97316]" },
  { name: "Mecha", color: "hover:text-[#06b6d4]" },
  { name: "Military", color: "hover:text-[#84cc16]" },
  { name: "Music", color: "hover:text-[#ec4899]" },
  { name: "Mystery", color: "hover:text-[#6366f1]" },
  { name: "Parody", color: "hover:text-[#eab308]" },
  { name: "Police", color: "hover:text-[#0ea5e9]" },
  { name: "Psychological", color: "hover:text-[#8b5cf6]" },
  { name: "Romance", color: "hover:text-[#f43f5e]" },
  { name: "Samurai", color: "hover:text-[#d97706]" },
  { name: "School", color: "hover:text-[#10b981]" },
  { name: "Sci-Fi", color: "hover:text-[#0284c7]" },
  { name: "Seinen", color: "hover:text-[#64748b]" },
  { name: "Shoujo", color: "hover:text-[#f472b6]" },
  { name: "Shounen", color: "hover:text-[#f97316]" },
  { name: "Slice of Life", color: "hover:text-[#14b8a6]" },
  { name: "Space", color: "hover:text-[#3b82f6]" },
  { name: "Sports", color: "hover:text-[#22c55e]" },
  { name: "Super Power", color: "hover:text-[#e11d48]" },
  { name: "Supernatural", color: "hover:text-[#9333ea]" },
  { name: "Thriller", color: "hover:text-[#dc2626]" },
  { name: "Vampire", color: "hover:text-[#be123c]" },
];

export function GenresCard() {
  const [showAll, setShowAll] = useState(false);

  const displayed = showAll ? ALL_GENRES : ALL_GENRES.slice(0, 24);

  return (
    <div className="w-full bg-[#13151b] rounded-lg border border-white/5 p-4 flex flex-col gap-3 select-none">
      <h3 className="text-base font-black text-white pb-2 border-b border-white/5">
        GENRES
      </h3>

      <div className="grid grid-cols-3 gap-x-2 gap-y-1.5 text-xs">
        {displayed.map((genre) => (
          <Link
            key={genre.name}
            href={`/search?genres=${encodeURIComponent(genre.name)}`}
            className={cn(
              "py-1 text-white/70 font-semibold truncate transition-colors cursor-pointer",
              genre.color
            )}
          >
            {genre.name}
          </Link>
        ))}
      </div>

      <button
        onClick={() => setShowAll((prev) => !prev)}
        className="flex items-center justify-center gap-1.5 w-full py-2 mt-1 rounded bg-[#181a24] hover:bg-[#202330] text-xs font-bold text-white/80 transition-colors cursor-pointer"
      >
        <span>{showAll ? "Show less" : "Show more"}</span>
        {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
