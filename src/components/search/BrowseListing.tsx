"use client";

import { useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Mic, Subtitles } from "lucide-react";
import type { Anime, AnimePageResult } from "@/lib/anilist/types";
import { getPreferredTitle } from "@/lib/utils/title";
import { getEpisodeCounts } from "@/lib/utils/episodes";
import { AnimeHoverPreview } from "@/components/anime/AnimeHoverPreview";
import { GenresCard } from "@/components/home/GenresCard";
import { HiAnimeTop10 } from "@/components/home/HiAnimeTop10";

function listingTitle(params: Record<string, string | undefined>) {
  if (params.q) return `Search results for “${params.q}”`;
  if (params.view === "latest") return "Latest Episodes";
  if (params.view === "new") return "New on An:me";
  if (params.genres) return `${params.genres.split(",")[0]} Anime`;
  if (params.status === "NOT_YET_RELEASED") return "Top Upcoming";
  if (params.status === "FINISHED") return "Completed Anime";
  if (params.sort === "UPDATED_AT_DESC") return "Recently Updated";
  if (params.sort === "START_DATE_DESC") return "Recently Added";
  if (params.sort === "POPULARITY_DESC") return "Most Popular";
  if (params.sort === "SCORE_DESC") return "Top Rated Anime";
  if (params.type) return `${params.type.replaceAll("_", " ")} Anime`;
  return "Browse Anime";
}

function pageHref(params: Record<string, string | undefined>, page: number) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== "page") query.set(key, value);
  });
  query.set("page", String(page));
  return `/search?${query.toString()}`;
}

export function BrowseListing({ data, params, topAnime }: { data: AnimePageResult; params: Record<string, string | undefined>; topAnime: Anime[] }) {
  const router = useRouter();
  const [isChangingPage, startTransition] = useTransition();
  const currentPage = data.pageInfo.currentPage || 1;
  const lastPage = Math.max(data.pageInfo.lastPage || 1, 1);
  const visiblePages = (() => {
    if (lastPage <= 7) return Array.from({ length: lastPage }, (_, index) => index + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5];
    if (currentPage >= lastPage - 3) return Array.from({ length: 5 }, (_, index) => lastPage - 4 + index);
    return Array.from({ length: 5 }, (_, index) => currentPage - 2 + index);
  })();

  // Warm the routes users are most likely to click so changing pages feels
  // immediate even though the results remain server-rendered and current.
  useEffect(() => {
    const candidates = new Set([...visiblePages, currentPage - 1, currentPage + 1, lastPage]);
    candidates.forEach((number) => {
      if (number >= 1 && number <= lastPage && number !== currentPage) {
        router.prefetch(pageHref(params, number));
      }
    });
  }, [currentPage, lastPage, params, router, visiblePages]);
  const goToPage = (target: number) => {
    const safeTarget = Math.min(lastPage, Math.max(1, target));
    if (safeTarget === currentPage || isChangingPage) return;
    startTransition(() => {
      router.push(pageHref(params, safeTarget));
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const pageButtonClass = (active = false, disabled = false) =>
    `grid h-9 w-9 place-items-center rounded-full text-xs font-bold transition-colors ${
      active ? "bg-gradient-to-br from-[#ff2f6d] to-[#7c3cff] text-white" : "bg-[#171923] hover:bg-[#252837]"
    } ${disabled || isChangingPage ? "cursor-not-allowed opacity-30" : "cursor-pointer"}`;

  return (
    <main className="w-full max-w-[1720px] mx-auto min-h-screen bg-[#0a0b0e] px-3 sm:px-6 lg:px-8 py-6 text-white">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-8 xl:col-span-9">
          <h1 className="mb-5 text-xl sm:text-2xl font-black text-[#ff4f86]">{listingTitle(params)}</h1>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-x-3 gap-y-5">
            {data.media.map((anime, index) => {
              const title = getPreferredTitle(anime.title);
              const counts = getEpisodeCounts(anime);
              return (
                <article key={anime.id} className="group relative min-w-0">
                  <AnimeHoverPreview anime={anime} side={index % 6 < 3 ? "right" : "left"} />
                  <Link href={`/anime/${anime.id}/details`} className="block">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-[#161822]">
                      <Image src={anime.coverImage} alt={title} fill sizes="(max-width:640px) 50vw, 16vw" className="object-cover" />
                      <span className="absolute left-1.5 top-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[9px] font-black">HD</span>
                      <div className="absolute bottom-1.5 left-1.5 flex gap-1 text-[9px] font-bold text-black">
                        <span className="flex items-center gap-0.5 rounded bg-[#57d889] px-1.5 py-0.5"><Subtitles className="h-2.5 w-2.5" />{counts.sub}</span>
                        {counts.dub > 0 && <span className="flex items-center gap-0.5 rounded bg-[#48cce9] px-1.5 py-0.5"><Mic className="h-2.5 w-2.5" />{counts.dub}</span>}
                        <span className="rounded bg-black/70 px-1.5 py-0.5 text-white">{counts.total ?? "?"}</span>
                      </div>
                    </div>
                    <h2 className="mt-2 truncate text-xs font-bold group-hover:text-[#ff2f6d]">{title}</h2>
                  </Link>
                  <div className="mt-1 flex gap-1.5 text-[10px] text-white/45">
                    <Link href={`/search?type=${anime.format || "TV"}`} className="hover:text-[#ff2f6d]">{anime.format || "TV"}</Link>
                    <span>•</span><span>{anime.duration ? `${anime.duration}m` : "Unknown"}</span>
                  </div>
                </article>
              );
            })}
          </div>

          {data.media.length === 0 && <div className="py-24 text-center text-white/50">No anime found.</div>}

          <nav className="flex justify-center items-center gap-2 py-12" aria-label="Pagination" aria-busy={isChangingPage}>
            <button type="button" aria-label="First page" disabled={currentPage <= 1 || isChangingPage} onClick={() => goToPage(1)} className={pageButtonClass(false, currentPage <= 1)}><ChevronsLeft className="h-4 w-4" /></button>
            <button type="button" aria-label="Previous page" disabled={currentPage <= 1 || isChangingPage} onClick={() => goToPage(currentPage - 1)} className={pageButtonClass(false, currentPage <= 1)}><ChevronLeft className="h-4 w-4" /></button>
            {visiblePages[0] > 1 && (
              <>
                <button type="button" disabled={currentPage === 1 || isChangingPage} onClick={() => goToPage(1)} className={pageButtonClass(currentPage === 1)}>1</button>
                <span className="text-white/40">…</span>
              </>
            )}
            {visiblePages.map((number) => <button type="button" key={number} disabled={number === currentPage || isChangingPage} aria-current={number === currentPage ? "page" : undefined} onClick={() => goToPage(number)} className={pageButtonClass(number === currentPage)}>{number}</button>)}
            {visiblePages.at(-1)! < lastPage && (
              <>
                <span className="text-white/40">…</span>
                <button type="button" disabled={lastPage === currentPage || isChangingPage} onClick={() => goToPage(lastPage)} className={pageButtonClass(lastPage === currentPage)}>{lastPage}</button>
              </>
            )}
            <button type="button" aria-label="Next page" disabled={currentPage >= lastPage || isChangingPage} onClick={() => goToPage(currentPage + 1)} className={pageButtonClass(false, currentPage >= lastPage)}><ChevronRight className="h-4 w-4" /></button>
            <button type="button" aria-label="Last page" disabled={currentPage >= lastPage || isChangingPage} onClick={() => goToPage(lastPage)} className={pageButtonClass(false, currentPage >= lastPage)}><ChevronsRight className="h-4 w-4" /></button>
          </nav>
        </section>

        <aside className="lg:col-span-4 xl:col-span-3 flex flex-col gap-5 lg:sticky lg:top-20">
          <GenresCard />
          <HiAnimeTop10 animeList={topAnime} />
        </aside>
      </div>
    </main>
  );
}
