"use client";

import React, { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import { notFound, useSearchParams, useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getAnimeDetails, getTrendingAnime } from "@/lib/anilist/client";
import { Anime } from "@/lib/anilist/types";
import { getDefaultPlaybackProvider, EpisodeItem } from "@/lib/providers";
import { getAnimeWatchProgress } from "@/lib/storage/watch-history";
import { getPreferredTitle } from "@/lib/utils/title";
import { HiAnimePlayer } from "@/components/player/HiAnimePlayer";
import { CommentsSection } from "@/components/watch/CommentsSection";
import { RecommendedSection } from "@/components/watch/RecommendedSection";
import { MostPopularSidebar } from "@/components/watch/MostPopularSidebar";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

function AnimePageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const animeId = Number(resolvedParams.id);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [anime, setAnime] = useState<Anime | null>(null);
  const [popularList, setPopularList] = useState<Anime[]>([]);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLightOff, setIsLightOff] = useState(false);

  // Read episode from URL query parameter
  const epParam = searchParams.get("ep") ? Number(searchParams.get("ep")) : 1;
  const partyCode = searchParams.get("party")?.toUpperCase() || null;
  const [currentEpisode, setCurrentEpisode] = useState(epParam);

  // Fetch anime data and popular list
  useEffect(() => {
    if (isNaN(animeId) || animeId <= 0) {
      notFound();
      return;
    }

    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const [data, popular] = await Promise.all([
          getAnimeDetails(animeId),
          getTrendingAnime(1, 10),
        ]);

        if (!isMounted) return;

        if (!data) {
          notFound();
          return;
        }

        setAnime(data);
        setPopularList(popular);

        // Load episodes with strict real AniList airing boundaries
        const provider = getDefaultPlaybackProvider();
        const eps = await provider.getEpisodes(
          data.id,
          data.episodes,
          data.title.english || data.title.romaji || undefined,
          data.streamingEpisodes,
          data.bannerImage,
          data.coverImage,
          data.status,
          data.latestAiredEpisode
        );
        if (isMounted) setEpisodes(eps);

        // Default to saved episode if not in URL and valid
        const savedProgress = getAnimeWatchProgress(data.id);
        if (
          savedProgress &&
          savedProgress.episode &&
          !searchParams.get("ep") &&
          eps.some((e) => e.number === savedProgress.episode)
        ) {
          setCurrentEpisode(savedProgress.episode);
        } else if (eps.length > 0 && !eps.some((e) => e.number === currentEpisode)) {
          setCurrentEpisode(eps[0].number);
        }
      } catch (err) {
        console.error("Failed to load anime:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  // Episode query changes are handled by the lightweight sync effect below.
  // Reload anime metadata only when navigating to a different anime.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeId]);

  // Sync state if URL changes
  useEffect(() => {
    if (searchParams.get("ep")) {
      setCurrentEpisode(Number(searchParams.get("ep")));
    }
  }, [searchParams]);

  const handleSelectEpisode = (epNum: number) => {
    setCurrentEpisode(epNum);
    router.replace(`/anime/${animeId}?ep=${epNum}`, { scroll: false });
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex flex-col pt-6 max-w-[1720px] mx-auto px-4 sm:px-6 gap-6 select-none">
        <Skeleton className="w-48 h-4 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <Skeleton className="lg:col-span-3 h-[500px] rounded-lg" />
          <Skeleton className="lg:col-span-6 h-[500px] rounded-lg" />
          <Skeleton className="lg:col-span-3 h-[500px] rounded-lg" />
        </div>
      </div>
    );
  }

  if (!anime) return null;

  const title = getPreferredTitle(anime.title);
  const totalEps = episodes.length > 0 ? episodes.length : anime.episodes || 0;

  return (
    <div className="relative w-full min-h-screen bg-[#0a0b0e] text-[#F5F7FA] pt-2 sm:pt-4 pb-24 lg:pb-16 px-2.5 sm:px-6 max-w-[1720px] mx-auto flex flex-col">
      {/* Light Off Theater Scrim */}
      {isLightOff && (
        <div
          onClick={() => setIsLightOff(false)}
          className="fixed inset-0 bg-black/92 z-10 transition-opacity backdrop-blur-sm cursor-pointer"
          title="Click to turn lights back on"
        />
      )}

      {/* Breadcrumb Navigation */}
      <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/50 mb-3 select-none flex-wrap">
        <Link href="/" className="hover:text-white transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-white/30" />
        <Link href={`/search?type=${anime.format || "TV"}`} className="hover:text-white transition-colors">
          {anime.format || "TV"}
        </Link>
        <ChevronRight className="w-3 h-3 text-white/30" />
        <span className="text-white/80 truncate max-w-xs sm:max-w-md">
          Watching {title}
        </span>
      </div>

      {/* Top 3-Column Theater Player Section */}
      <div className="relative z-20">
        <HiAnimePlayer
          anime={anime}
          currentEpisode={currentEpisode}
          episodes={episodes}
          onSelectEpisode={handleSelectEpisode}
          isLightOff={isLightOff}
          onToggleLight={() => setIsLightOff((prev) => !prev)}
          partyCode={partyCode}
        />
      </div>

      {/* Lower 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start mt-4 lg:mt-6">
        {/* Left Column (Comments + Recommended For You) */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
          <CommentsSection
            animeId={anime.id}
            currentEpisode={currentEpisode}
            totalEpisodes={totalEps}
            onSelectEpisode={handleSelectEpisode}
          />

          <RecommendedSection recommendations={anime.recommendations} />
        </div>

        {/* Right Column (Most Popular Sidebar) */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3">
          <MostPopularSidebar animeList={popularList} />
        </div>
      </div>

    </div>
  );
}

export default function AnimePage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen flex flex-col pt-6 max-w-[1720px] mx-auto px-4 sm:px-6 gap-6">
          <Skeleton className="w-full h-80 rounded-2xl" />
        </div>
      }
    >
      <AnimePageContent {...props} />
    </Suspense>
  );
}
