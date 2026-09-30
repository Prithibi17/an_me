import React from "react";
import Link from "next/link";
import { Anime } from "@/lib/anilist/types";
import { cleanDescription, formatDuration } from "@/lib/utils/format";

interface OverviewProps {
  anime: Anime;
}

export function Overview({ anime }: OverviewProps) {
  const description = cleanDescription(anime.description);

  const metadataItems = [
    { label: "Status", value: anime.status || "Unknown" },
    { label: "Episodes", value: anime.episodes ? String(anime.episodes) : "Unknown" },
    { label: "Duration", value: formatDuration(anime.duration) },
    { label: "Format", value: anime.format || "TV" },
    {
      label: "Season",
      value:
        anime.season && anime.seasonYear
          ? anime.season + " " + anime.seasonYear
          : anime.seasonYear
          ? String(anime.seasonYear)
          : "Unknown",
    },
    { label: "Studio", value: anime.studios?.join(", ") || "Unknown" },
    { label: "Source", value: anime.source || "Manga" },
  ];

  return (
    <div className="w-full flex flex-col md:flex-row gap-8 pt-4">
      <div className="flex-1 flex flex-col gap-3">
        <h3 className="text-base font-bold text-[#F5F7FA]">Synopsis</h3>
        <p className="text-sm md:text-base text-[#9CA3AF] leading-relaxed whitespace-pre-line">
          {description || "No synopsis available for this anime."}
        </p>

        {anime.genres && anime.genres.length > 0 && (
          <div className="flex flex-col gap-2 pt-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
              Genres
            </h4>
            <div className="flex flex-wrap gap-2">
              {anime.genres.map((g) => (
                <Link
                  key={g}
                  href={`/search?genres=${encodeURIComponent(g)}`}
                  className="px-3 py-1 rounded-md bg-[#11151B] border border-white/5 text-xs font-semibold text-[#F5F7FA]"
                >
                  {g}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-full md:w-72 shrink-0 p-5 rounded-xl bg-[#11151B] border border-white/5 flex flex-col gap-3.5">
        <h4 className="text-sm font-bold text-[#F5F7FA] border-b border-white/5 pb-2">
          Anime Information
        </h4>
        <div className="flex flex-col gap-2.5 text-xs md:text-sm">
          {metadataItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-2"
            >
              <span className="text-[#9CA3AF] font-medium">{item.label}</span>
              {item.label === "Format" ? (
                <Link href={`/search?type=${encodeURIComponent(item.value)}`} className="text-[#F5F7FA] hover:text-[#7c3cff] font-semibold text-right truncate">
                  {item.value}
                </Link>
              ) : (
                <span className="text-[#F5F7FA] font-semibold text-right truncate">{item.value}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
