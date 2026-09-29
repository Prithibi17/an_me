"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  X,
  ChevronLeft,
  Home,
  Film,
  Tv,
  Flame,
  Sparkles,
  Calendar,
  Newspaper,
  MessageSquare,
  SlidersHorizontal,
  Compass,
  Radio,
  Send,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_LINKS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Subbed Anime", href: "/filter?language=SUB", icon: Layers },
  { label: "Dubbed Anime", href: "/filter?language=DUB", icon: Layers },
  { label: "Most Popular", href: "/filter?sort=Most+Watched", icon: Flame },
  { label: "Movies", href: "/filter?type=Movie", icon: Film },
  { label: "TV Series", href: "/filter?type=TV", icon: Tv },
  { label: "OVAs", href: "/filter?type=OVA", icon: Compass },
  { label: "ONAs", href: "/filter?type=ONA", icon: Compass },
  { label: "Specials", href: "/filter?type=Special", icon: Sparkles },
  { label: "Top Airing", href: "/filter?status=Currently+Airing", icon: Flame },
  { label: "Estimated Schedule", href: "/#schedule", icon: Calendar },
  { label: "News", href: "/news", icon: Newspaper },
  { label: "Community", href: "/community", icon: MessageSquare },
  { label: "Filter Anime", href: "/filter", icon: SlidersHorizontal },
];

const POPULAR_GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Isekai",
  "Magic",
  "Mecha",
  "Music",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Shounen",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
];

export function SidebarDrawer({ isOpen, onClose }: SidebarDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [genresExpanded, setGenresExpanded] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
      {/* Dark backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity cursor-pointer"
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-72 sm:w-80 max-w-[85vw] h-full bg-[#12141c] border-r border-white/10 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250 select-none">
        {/* Drawer Header */}
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-[#151824]">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-[#ff5c8a]" />
            <span>Close menu</span>
          </button>

          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-1 group"
          >
            <span className="text-xl font-black tracking-tight text-white flex items-center">
              An<span className="text-[#ff5c8a]">:</span>me
            </span>
          </Link>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {/* Community Social Links Bar */}
          <div className="grid grid-cols-3 gap-2">
            <a
              href="https://discord.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#5865F2]/15 hover:bg-[#5865F2]/25 text-white/90 text-[11px] font-semibold transition-colors border border-[#5865F2]/20"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#5865F2]" />
              <span>Discord</span>
            </a>
            <a
              href="https://telegram.org"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#229ED9]/15 hover:bg-[#229ED9]/25 text-white/90 text-[11px] font-semibold transition-colors border border-[#229ED9]/20"
            >
              <Send className="w-3.5 h-3.5 text-[#229ED9]" />
              <span>Telegram</span>
            </a>
            <a
              href="https://reddit.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#FF4500]/15 hover:bg-[#FF4500]/25 text-white/90 text-[11px] font-semibold transition-colors border border-[#FF4500]/20"
            >
              <Radio className="w-3.5 h-3.5 text-[#FF4500]" />
              <span>Reddit</span>
            </a>
          </div>

          {/* Primary Menu Links */}
          <div className="space-y-0.5">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group cursor-pointer",
                    isActive
                      ? "bg-[#ff5c8a] text-white font-bold shadow-sm shadow-[#ff5c8a]/20"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-transform group-hover:scale-110",
                      isActive ? "text-white" : "text-white/60 group-hover:text-[#ff5c8a]"
                    )}
                  />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Genres Accordion Section */}
          <div className="pt-2 border-t border-white/5">
            <button
              onClick={() => setGenresExpanded((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-bold transition-colors cursor-pointer"
            >
              <span className="uppercase text-[11px] tracking-wider text-[#ff5c8a]">
                Genres
              </span>
              {genresExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-white/50" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-white/50" />
              )}
            </button>

            {genresExpanded && (
              <div className="grid grid-cols-2 gap-1.5 pt-2.5 px-1 animate-in fade-in duration-150">
                {POPULAR_GENRES.map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      onClose();
                      router.push(`/filter?genres=${encodeURIComponent(g)}`);
                    }}
                    className="px-2.5 py-1.5 rounded bg-[#181a24] hover:bg-[#ff5c8a] hover:text-white text-white/70 text-[11px] font-medium transition-colors text-left truncate cursor-pointer"
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-white/5 bg-[#0f1118] text-center text-[10px] text-white/40">
          <span>An:me • Powered by AniList</span>
        </div>
      </div>
    </div>
  );
}
