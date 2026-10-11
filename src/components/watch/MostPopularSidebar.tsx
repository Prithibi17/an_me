"use client";
import type { Anime } from "@/lib/anilist/types";
import { CinematicMediaRow } from "@/components/anime/CinematicMediaRow";

export function MostPopularSidebar({ animeList }: { animeList: Anime[] }) {
  return <section className="flex w-full flex-col gap-3 rounded-xl border border-white/[0.07] bg-[#0f1218]/90 p-3.5 shadow-[0_18px_48px_rgba(0,0,0,.18)]">
    <h3 className="border-b border-white/[0.07] pb-2.5 text-base font-black uppercase tracking-[.08em] text-white">Most Popular</h3>
    <div className="flex flex-col gap-2">{animeList.slice(0, 10).map((item) => <CinematicMediaRow key={item.id} anime={item} />)}</div>
  </section>;
}
