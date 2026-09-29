"use client";

import React from "react";
import { X } from "lucide-react";

interface ActiveFiltersProps {
  genre?: string;
  year?: string;
  season?: string;
  format?: string;
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export function ActiveFilters({
  genre,
  year,
  season,
  format,
  onRemove,
  onClearAll,
}: ActiveFiltersProps) {
  const hasActive = Boolean(genre || year || season || format);

  if (!hasActive) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {genre && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7657FF]/20 border border-[#7657FF]/40 text-[#866DFF] text-xs font-semibold">
          <span>{genre}</span>
          <button
            onClick={() => onRemove("genre")}
            aria-label="Remove genre filter"
            className="hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {year && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7657FF]/20 border border-[#7657FF]/40 text-[#866DFF] text-xs font-semibold">
          <span>{year}</span>
          <button
            onClick={() => onRemove("year")}
            aria-label="Remove year filter"
            className="hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {season && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7657FF]/20 border border-[#7657FF]/40 text-[#866DFF] text-xs font-semibold">
          <span>{season}</span>
          <button
            onClick={() => onRemove("season")}
            aria-label="Remove season filter"
            className="hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {format && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7657FF]/20 border border-[#7657FF]/40 text-[#866DFF] text-xs font-semibold">
          <span>{format}</span>
          <button
            onClick={() => onRemove("format")}
            aria-label="Remove format filter"
            className="hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      <button
        onClick={onClearAll}
        className="text-xs text-[#9CA3AF] hover:text-[#F5F7FA] font-medium ml-1 underline cursor-pointer"
      >
        Clear all
      </button>
    </div>
  );
}
