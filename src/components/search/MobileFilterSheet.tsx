"use client";

import React from "react";
import { X } from "lucide-react";
import { GENRES, YEARS, SEASONS, FORMATS } from "./constants";
import { cn } from "@/lib/utils";

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGenre?: string;
  selectedYear?: string;
  selectedSeason?: string;
  selectedFormat?: string;
  onFilterChange: (key: string, value: string | undefined) => void;
  onReset: () => void;
}

export function MobileFilterSheet({
  isOpen,
  onClose,
  selectedGenre,
  selectedYear,
  selectedSeason,
  selectedFormat,
  onFilterChange,
  onReset,
}: MobileFilterSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-h-[85vh] overflow-y-auto bg-[#0D1015] border-t border-white/10 rounded-t-2xl p-5 flex flex-col gap-5 safe-area-bottom">
        {/* Handle & Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
          <div className="w-full flex items-center justify-between">
            <h3 className="text-base font-bold text-[#F5F7FA]">Filters</h3>
            <button
              onClick={onClose}
              className="p-1 text-[#9CA3AF] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Genre Section */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">
            Genre
          </span>
          <div className="flex flex-wrap gap-1.5">
            {GENRES.map((g) => {
              const active = selectedGenre === g;
              return (
                <button
                  key={g}
                  onClick={() => onFilterChange("genre", active ? undefined : g)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    active
                      ? "bg-[#7657FF] text-white"
                      : "bg-[#161B22] text-[#9CA3AF] border border-white/5"
                  )}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Year Section */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">
            Year
          </span>
          <select
            value={selectedYear || ""}
            onChange={(e) => onFilterChange("year", e.target.value || undefined)}
            className="w-full h-10 px-3 rounded-lg bg-[#161B22] border border-white/10 text-xs font-semibold text-[#F5F7FA] focus:outline-none"
          >
            <option value="">All Years</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Season Section */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">
            Season
          </span>
          <div className="grid grid-cols-2 gap-2">
            {SEASONS.map((s) => {
              const active = selectedSeason === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() =>
                    onFilterChange("season", active ? undefined : s.value)
                  }
                  className={cn(
                    "py-2 px-3 rounded-lg text-xs font-medium transition-colors",
                    active
                      ? "bg-[#7657FF] text-white"
                      : "bg-[#161B22] text-[#9CA3AF] border border-white/5"
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Format Section */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">
            Format
          </span>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => {
              const active = selectedFormat === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() =>
                    onFilterChange("format", active ? undefined : f.value)
                  }
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    active
                      ? "bg-[#7657FF] text-white"
                      : "bg-[#161B22] text-[#9CA3AF] border border-white/5"
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onReset}
            className="flex-1 py-2.5 rounded-lg bg-[#161B22] hover:bg-[#1f2630] border border-white/10 text-xs font-semibold text-[#F5F7FA]"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="flex-2 py-2.5 rounded-lg bg-[#7657FF] hover:bg-[#866DFF] text-xs font-semibold text-white shadow-md shadow-[#7657FF]/30"
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
}
