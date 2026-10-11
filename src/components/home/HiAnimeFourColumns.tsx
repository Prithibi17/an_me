"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Anime } from "@/lib/anilist/types";
import { CinematicMediaRow } from "@/components/anime/CinematicMediaRow";

interface FourColumnsProps { topAiring: Anime[]; mostFavorite: Anime[]; latestCompleted: Anime[]; }

function ColumnBlock({ title, items, viewMoreHref }: { title: string; items: Anime[]; viewMoreHref: string }) {
  return <section className="rounded-xl border border-white/[0.07] bg-[#0f1218]/90 p-3.5 shadow-[0_18px_48px_rgba(0,0,0,.18)]">
    <div className="mb-3 flex items-center justify-between border-b border-white/[0.07] pb-2.5">
      <h3 className="text-sm font-black uppercase tracking-[.08em] text-white">{title}</h3>
      <Link href={viewMoreHref} className="inline-flex items-center gap-1 text-[11px] font-bold text-white/45 transition-colors hover:text-[var(--accent)]">More <ChevronRight className="h-3.5 w-3.5" /></Link>
    </div>
    <div className="flex flex-col gap-2">{items.slice(0, 5).map((item) => <CinematicMediaRow key={item.id} anime={item} />)}</div>
  </section>;
}

export function HiAnimeFourColumns({ topAiring, mostFavorite, latestCompleted }: FourColumnsProps) {
  return <div className="my-4 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
    <ColumnBlock title="Top Airing" items={topAiring} viewMoreHref="/search?sort=POPULARITY_DESC&status=RELEASING" />
    <ColumnBlock title="Most Favorite" items={mostFavorite} viewMoreHref="/search?sort=SCORE_DESC" />
    <ColumnBlock title="Latest Completed" items={latestCompleted} viewMoreHref="/search?sort=SCORE_DESC&status=FINISHED" />
  </div>;
}
