"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Mic, Star, Subtitles } from "lucide-react";
import type { Anime } from "@/lib/anilist/types";
import { getPreferredTitle } from "@/lib/utils/title";
import { formatScore } from "@/lib/utils/format";
import { getEpisodeCounts } from "@/lib/utils/episodes";
import { cn } from "@/lib/utils";

interface CinematicMediaRowProps {
  anime: Anime;
  rank?: number;
  className?: string;
}

export function CinematicMediaRow({ anime, rank, className }: CinematicMediaRowProps) {
  const title = getPreferredTitle(anime.title);
  const counts = getEpisodeCounts(anime);

  return (
    <article className={cn("cinematic-row group", className)}>
      <div className="cinematic-row__backdrop" aria-hidden="true">
        <Image
          src={anime.bannerImage || anime.coverImage}
          alt=""
          fill
          sizes="420px"
          className="object-cover object-center"
        />
      </div>
      <div className="cinematic-row__scrim" aria-hidden="true" />

      {typeof rank === "number" && (
        <span className={cn("cinematic-row__rank", rank <= 3 && "cinematic-row__rank--top")}>
          {String(rank).padStart(2, "0")}
        </span>
      )}

      <Link href={`/anime/${anime.id}/details`} className="cinematic-row__poster" aria-label={`View ${title}`}>
        <Image src={anime.coverImage} alt="" fill sizes="64px" className="object-cover" />
      </Link>

      <div className="relative z-10 min-w-0 flex-1 py-3">
        <div className="flex items-start gap-2">
          <span className="mt-[0.48rem] h-2 w-2 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,.65)]" />
          <Link
            href={`/anime/${anime.id}/details`}
            className="line-clamp-2 text-base font-semibold leading-snug text-white transition-colors group-hover:text-[var(--accent)] focus-visible:text-[var(--accent)]"
          >
            {title}
          </Link>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pl-4 text-[11px] font-bold text-white/55">
          <span className="rounded bg-white/[0.06] px-1.5 py-0.5">{anime.format || "TV"}</span>
          {anime.seasonYear && (
            <span className="inline-flex items-center gap-1 rounded bg-white/[0.06] px-1.5 py-0.5">
              <CalendarDays className="h-3 w-3" /> {anime.seasonYear}
            </span>
          )}
          {counts.sub > 0 && (
            <span className="inline-flex items-center gap-1" title={`${counts.sub} subtitle episodes`}>
              <Subtitles className="h-3 w-3" /> {counts.sub}
            </span>
          )}
          {counts.dub > 0 && (
            <span className="inline-flex items-center gap-1" title={`${counts.dub} dubbed episodes`}>
              <Mic className="h-3 w-3" /> {counts.dub}
            </span>
          )}
          {anime.score != null && (
            <span className="inline-flex items-center gap-1 text-amber-200/70">
              <Star className="h-3 w-3" /> {formatScore(anime.score)}
            </span>
          )}
        </div>
      </div>

    </article>
  );
}
