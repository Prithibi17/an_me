"use client";
import { useState } from "react";
import type { Anime } from "@/lib/anilist/types";
import { cn } from "@/lib/utils";
import { CinematicMediaRow } from "@/components/anime/CinematicMediaRow";

export function HiAnimeTop10({ animeList }: { animeList: Anime[] }) {
  const [activeTab, setActiveTab] = useState<"Today" | "Week" | "Month">("Today");
  return <section className="my-4 flex w-full flex-col gap-3 rounded-xl border border-white/[0.07] bg-[#0f1218]/90 p-3.5 shadow-[0_18px_48px_rgba(0,0,0,.18)]">
    <div className="flex items-center justify-between border-b border-white/[0.07] pb-2.5">
      <h3 className="text-base font-black uppercase tracking-[.08em] text-white">Top 10</h3>
      <div className="flex rounded-lg border border-white/[0.07] bg-black/20 p-0.5 text-[10px] font-bold" role="tablist" aria-label="Top anime time range">
        {(["Today", "Week", "Month"] as const).map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={cn("rounded-md px-2 py-1 transition-colors", activeTab === tab ? "bg-gradient-to-br from-[#ff2f6d] to-[#7c3cff] text-white" : "text-white/50 hover:text-white")}>{tab}</button>)}
      </div>
    </div>
    <div className="flex flex-col gap-2">{animeList.slice(0, 10).map((item, index) => <CinematicMediaRow key={item.id} anime={item} rank={index + 1} showAction={false} />)}</div>
  </section>;
}
