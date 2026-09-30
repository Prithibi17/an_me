"use client";

import React, { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Bookmark, History, Play, Trash2 } from "lucide-react";
import { useAnimeList } from "@/hooks/useAnimeList";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { toggleAnimeInList } from "@/lib/storage/anime-list";
import { removeWatchProgress } from "@/lib/storage/watch-history";
import { cn } from "@/lib/utils";

function LibraryContent() {
  const params = useSearchParams();
  const activeTab = params.get("tab") === "history" ? "history" : "watchlist";
  const { savedList } = useAnimeList();
  const { history, isLoading } = useWatchHistory();

  const empty = activeTab === "watchlist" ? savedList.length === 0 : !isLoading && history.length === 0;

  return (
    <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 py-8 min-h-[70vh]">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-white">My Library</h1>
        <p className="text-sm text-white/50">Your saved anime and watch progress.</p>
      </div>

      <div className="flex gap-2 border-b border-white/10 mb-6">
        <Link href="/my-list?tab=watchlist" className={cn("flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2", activeTab === "watchlist" ? "border-[#ff2f6d] text-[#ff2f6d]" : "border-transparent text-white/55 hover:text-white")}>
          <Bookmark className="w-4 h-4" /> Watchlist <span className="text-xs">({savedList.length})</span>
        </Link>
        <Link href="/my-list?tab=history" className={cn("flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2", activeTab === "history" ? "border-[#ff2f6d] text-[#ff2f6d]" : "border-transparent text-white/55 hover:text-white")}>
          <History className="w-4 h-4" /> Watch History <span className="text-xs">({history.length})</span>
        </Link>
      </div>

      {empty ? (
        <div className="rounded-xl border border-white/5 bg-[#111318] py-20 text-center">
          <p className="font-bold text-white/70">{activeTab === "watchlist" ? "Your watchlist is empty" : "No watch history yet"}</p>
          <Link href="/search" className="inline-block mt-3 text-sm font-bold text-[#ff2f6d] hover:underline">Browse anime</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {activeTab === "watchlist" ? savedList.map((item) => (
            <article key={item.animeId} className="group rounded-xl overflow-hidden bg-[#111318] border border-white/5">
              <Link href={`/anime/${item.animeId}/details`} className="block relative aspect-[2/3] overflow-hidden">
                <Image src={item.coverImage} alt={item.title} fill sizes="220px" className="object-cover group-hover:scale-105 transition-transform" />
              </Link>
              <div className="p-3 flex flex-col gap-2">
                <Link href={`/anime/${item.animeId}/details`} className="font-bold text-sm text-white truncate hover:text-[#ff2f6d]">{item.title}</Link>
                <div className="flex items-center justify-between text-xs text-white/45"><span>{item.format || "Anime"}</span><span>{item.year || ""}</span></div>
                <button onClick={() => toggleAnimeInList({ animeId: item.animeId, title: item.title, coverImage: item.coverImage, score: item.score, format: item.format, year: item.year })} className="flex items-center justify-center gap-1.5 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold"><Trash2 className="w-3.5 h-3.5" /> Remove</button>
              </div>
            </article>
          )) : history.map((item) => {
            const percent = item.duration > 0 ? Math.min(100, Math.round((item.currentTime / item.duration) * 100)) : 0;
            return (
              <article key={item.animeId} className="group rounded-xl overflow-hidden bg-[#111318] border border-white/5">
                <Link href={`/anime/${item.animeId}?ep=${item.episode}`} className="block relative aspect-video overflow-hidden">
                  <Image src={item.bannerImage || item.coverImage} alt={item.animeTitle} fill sizes="260px" className="object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/25 grid place-items-center"><span className="w-10 h-10 rounded-full bg-[#7c3cff] grid place-items-center"><Play className="w-4 h-4 fill-white" /></span></div>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-black/60"><div className="h-full bg-[#ff2f6d]" style={{ width: `${percent}%` }} /></div>
                </Link>
                <div className="p-3 flex flex-col gap-2">
                  <Link href={`/anime/${item.animeId}?ep=${item.episode}`} className="font-bold text-sm text-white truncate hover:text-[#ff2f6d]">{item.animeTitle}</Link>
                  <span className="text-xs text-white/50">Episode {item.episode} · {percent}% watched</span>
                  <button onClick={() => removeWatchProgress(item.animeId)} className="flex items-center justify-center gap-1.5 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold"><Trash2 className="w-3.5 h-3.5" /> Remove</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MyListPage() {
  return <Suspense fallback={<div className="min-h-[70vh]" />}><LibraryContent /></Suspense>;
}
