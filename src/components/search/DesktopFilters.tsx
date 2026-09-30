"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { GENRES, YEARS, SEASONS, FORMATS, SORTS } from "./constants";

interface DesktopFiltersProps {
  selectedGenre?: string;
  selectedYear?: string;
  selectedSeason?: string;
  selectedFormat?: string;
  selectedSort?: string;
  onFilterChange: (key: string, value: string | undefined) => void;
}

export function DesktopFilters({
  selectedGenre,
  selectedYear,
  selectedSeason,
  selectedFormat,
  selectedSort,
  onFilterChange,
}: DesktopFiltersProps) {
  return (
    <div className="hidden md:flex flex-wrap items-center gap-3">
      {/* Genre Dropdown */}
      <div className="relative">
        <select
          value={selectedGenre || ""}
          onChange={(e) => onFilterChange("genre", e.target.value || undefined)}
          className="appearance-none h-9 px-3.5 pr-8 rounded-lg bg-[#11151B] border border-white/10 hover:border-white/20 text-xs font-semibold text-[#F5F7FA] focus:outline-none focus:border-[#7c3cff] cursor-pointer"
        >
          <option value="" className="bg-[#11151B] text-[#9CA3AF]">
            Genre: All
          </option>
          {GENRES.map((g) => (
            <option key={g} value={g} className="bg-[#11151B] text-[#F5F7FA]">
              {g}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Year Dropdown */}
      <div className="relative">
        <select
          value={selectedYear || ""}
          onChange={(e) => onFilterChange("year", e.target.value || undefined)}
          className="appearance-none h-9 px-3.5 pr-8 rounded-lg bg-[#11151B] border border-white/10 hover:border-white/20 text-xs font-semibold text-[#F5F7FA] focus:outline-none focus:border-[#7c3cff] cursor-pointer"
        >
          <option value="" className="bg-[#11151B] text-[#9CA3AF]">
            Year: All
          </option>
          {YEARS.map((y) => (
            <option key={y} value={y} className="bg-[#11151B] text-[#F5F7FA]">
              {y}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Season Dropdown */}
      <div className="relative">
        <select
          value={selectedSeason || ""}
          onChange={(e) => onFilterChange("season", e.target.value || undefined)}
          className="appearance-none h-9 px-3.5 pr-8 rounded-lg bg-[#11151B] border border-white/10 hover:border-white/20 text-xs font-semibold text-[#F5F7FA] focus:outline-none focus:border-[#7c3cff] cursor-pointer"
        >
          <option value="" className="bg-[#11151B] text-[#9CA3AF]">
            Season: All
          </option>
          {SEASONS.map((s) => (
            <option key={s.value} value={s.value} className="bg-[#11151B] text-[#F5F7FA]">
              {s.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Format Dropdown */}
      <div className="relative">
        <select
          value={selectedFormat || ""}
          onChange={(e) => onFilterChange("format", e.target.value || undefined)}
          className="appearance-none h-9 px-3.5 pr-8 rounded-lg bg-[#11151B] border border-white/10 hover:border-white/20 text-xs font-semibold text-[#F5F7FA] focus:outline-none focus:border-[#7c3cff] cursor-pointer"
        >
          <option value="" className="bg-[#11151B] text-[#9CA3AF]">
            Format: All
          </option>
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value} className="bg-[#11151B] text-[#F5F7FA]">
              {f.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Sort Dropdown */}
      <div className="relative">
        <select
          value={selectedSort || "TRENDING_DESC"}
          onChange={(e) => onFilterChange("sort", e.target.value)}
          className="appearance-none h-9 px-3.5 pr-8 rounded-lg bg-[#11151B] border border-white/10 hover:border-white/20 text-xs font-semibold text-[#F5F7FA] focus:outline-none focus:border-[#7c3cff] cursor-pointer"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value} className="bg-[#11151B] text-[#F5F7FA]">
              Sort: {s.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}
