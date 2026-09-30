import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface GenreChipProps {
  genre: string;
  active?: boolean;
  onClick?: () => void;
  asLink?: boolean;
  size?: "sm" | "md";
}

export function GenreChip({
  genre,
  active = false,
  onClick,
  asLink = true,
  size = "md",
}: GenreChipProps) {
  const sizeClasses = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-xs md:text-sm";

  const baseClasses = cn(
    "inline-flex items-center justify-center rounded-full font-medium transition-colors duration-150 cursor-pointer select-none",
    sizeClasses,
    active
      ? "bg-[#7c3cff] text-white border border-[#7c3cff]"
      : "bg-[#11151B] hover:bg-[#161B22] text-[#9CA3AF] hover:text-[#F5F7FA] border border-white/5 hover:border-white/15"
  );

  if (asLink) {
    return (
      <Link href={"/search?genres=" + encodeURIComponent(genre)} className={baseClasses}>
        {genre}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClasses}>
      {genre}
    </button>
  );
}
