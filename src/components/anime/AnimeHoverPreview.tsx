"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Mic, Play, Plus, Star, Subtitles } from "lucide-react";
import type { Anime } from "@/lib/anilist/types";
import { getPreferredTitle } from "@/lib/utils/title";
import { cleanDescription, formatScore } from "@/lib/utils/format";
import { useAnimeList } from "@/hooks/useAnimeList";
import { cn } from "@/lib/utils";
import { getEpisodeCounts } from "@/lib/utils/episodes";

export function AnimeHoverPreview({ anime, side = "right" }: { anime: Anime; side?: "left" | "right" }) {
  const { inList, toggle } = useAnimeList(anime.id);
  const title = getPreferredTitle(anime.title);
  const counts = getEpisodeCounts(anime);
  const description = cleanDescription(anime.description) || "No synopsis is available for this anime yet.";
  const aired = anime.seasonYear
    ? `${anime.season ? `${anime.season.charAt(0)}${anime.season.slice(1).toLowerCase()} ` : ""}${anime.seasonYear}`
    : "Not announced";

  const toggleList = () => {
    toggle({
      animeId: anime.id,
      title,
      coverImage: anime.coverImage,
      score: anime.score,
      format: anime.format,
      year: anime.seasonYear,
    });
  };

  return (
    <aside className={cn(
      "pointer-events-none absolute z-50 top-0 w-[240px] translate-y-1 overflow-hidden rounded-lg border border-white/10 bg-[#343342] text-white opacity-0 shadow-2xl shadow-black/60 transition-all duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 hidden lg:block",
      side === "right" ? "left-[calc(100%+8px)]" : "right-[calc(100%+8px)]"
    )}>
      <div className="absolute inset-0 opacity-25">
        <Image src={anime.bannerImage || anime.coverImage} alt="" fill sizes="360px" className="object-cover blur-xl scale-125" />
        <div className="absolute inset-0 bg-[#2f2e3d]/80" />
      </div>

      <div className="relative flex flex-col gap-2 p-2.5">
        <Link href={`/anime/${anime.id}/details`} className="text-sm font-black hover:text-[#ffabd3] transition-colors line-clamp-1">
          {title}
        </Link>

        <div className="flex flex-wrap items-center gap-1 text-[10px] font-bold">
          <span className="mr-1 flex items-center gap-1 text-white/70"><Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />{formatScore(anime.score)}</span>
          <span className="rounded bg-[#ffabd3] px-1.5 py-0.5 text-black">HD</span>
          <span title="Subtitle episodes" className="flex items-center gap-1 rounded bg-[#a7e9b3] px-1.5 py-0.5 text-black"><Subtitles className="h-2.5 w-2.5" />{counts.sub}</span>
          {counts.dub > 0 && <span title="Dub episodes" className="flex items-center gap-1 rounded bg-[#a7ddf6] px-1.5 py-0.5 text-black"><Mic className="h-2.5 w-2.5" />{counts.dub}</span>}
          <span title="Total episodes" className="rounded bg-black/70 px-1.5 py-0.5 text-white">{counts.total ?? "?"}</span>
          <Link href={`/search?type=${encodeURIComponent(anime.format || "TV")}`} className="ml-auto rounded bg-[#ffabd3] px-1.5 py-0.5 text-black hover:bg-white">
            {anime.format || "TV"}
          </Link>
        </div>

        <p className="text-[11px] leading-[15px] text-white/75 line-clamp-2">{description}</p>

        <dl className="text-[11px] leading-4 text-white/75">
          <div><dt className="inline">Aired: </dt><dd className="inline text-white">{aired}</dd></div>
          <div><dt className="inline">Status: </dt><dd className="inline text-white">{(anime.status || "Unknown").replaceAll("_", " ")}</dd></div>
          <div>
            <dt className="inline">Genres: </dt>
            <dd className="inline text-white line-clamp-1">{anime.genres?.slice(0, 5).join(", ") || "Unknown"}</dd>
          </div>
        </dl>

        <div className="flex items-center gap-3 pt-1">
          {counts.sub > 0 ? (
            <Link href={`/anime/${anime.id}?ep=${counts.sub}`} className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#ffabd3] text-xs font-black text-black hover:bg-[#ff91c5] transition-colors">
              <Play className="h-3.5 w-3.5 fill-current" /> Watch now
            </Link>
          ) : (
            <span className="flex h-8 flex-1 items-center justify-center rounded-full bg-white/10 px-2 text-[10px] font-bold text-white/70">Schedule not announced</span>
          )}
          <button type="button" onClick={toggleList} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-black hover:bg-[#ffabd3] transition-colors" title={inList ? "Remove from list" : "Add to list"}>
            {inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
