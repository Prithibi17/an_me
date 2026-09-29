"use client";

import React, { useRef } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = "Search anime by title, character, or studio...",
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#9CA3AF]">
        <Search className="w-5 h-5" />
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 md:h-14 pl-12 pr-12 rounded-xl bg-[#11151B] border border-white/10 hover:border-white/20 focus:border-[#7657FF] focus:outline-none focus:ring-1 focus:ring-[#7657FF] text-[#F5F7FA] text-sm md:text-base placeholder-[#6B7280] shadow-sm transition-all"
      />

      {value && (
        <button
          type="button"
          onClick={() => {
            onClear();
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#9CA3AF] hover:text-[#F5F7FA] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
