"use client";

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { fetchAnimeDetails } from "@/lib/data/client";
import type { Anime } from "@/lib/anilist/types";
import { getDefaultPlaybackProvider, type EpisodeItem } from "@/lib/providers";
import { getAnimeWatchProgress } from "@/lib/storage/watch-history";
import { AnimeHero } from "@/components/details/AnimeHero";
import { DetailsTabs, type DetailTab } from "@/components/details/DetailsTabs";
import { Skeleton } from "@/components/ui/Skeleton";

const TabSkeleton = () => <Skeleton className="mt-5 h-48 w-full rounded-xl" />;
const Overview = dynamic(() => import("@/components/details/Overview").then((module) => module.Overview), { loading: TabSkeleton });
const EpisodeSection = dynamic(() => import("@/components/details/EpisodeSection").then((module) => module.EpisodeSection), { loading: TabSkeleton });
const CharactersList = dynamic(() => import("@/components/details/CharactersList").then((module) => module.CharactersList), { loading: TabSkeleton });
const RelatedList = dynamic(() => import("@/components/details/RelatedList").then((module) => module.RelatedList), { loading: TabSkeleton });

export default function AnimeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const animeId = Number(id);
  const validAnimeId = Number.isFinite(animeId) && animeId > 0;
  const router = useRouter();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [loading, setLoading] = useState(validAnimeId);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        // Parallelize the rich metadata request with the fast core request.
        // The hero paints from core data while enrichment continues.
        const fullDataPromise = fetchAnimeDetails(animeId, { includeEpisodeStills: false });
        const coreData = await fetchAnimeDetails(animeId, { core: true });
        if (!coreData || !active) return;
        setAnime(coreData);
        const quickCount = coreData.latestAiredEpisode || (coreData.status === "FINISHED" ? coreData.episodes : 0) || 0;
        if (quickCount > 0) {
          setEpisodes(Array.from({ length: quickCount }, (_, index) => ({
            number: index + 1,
            title: `Episode ${index + 1}`,
            duration: coreData.duration || 24,
          })));
        }
        setLoading(false);

        const data = await fullDataPromise || coreData;
        if (!active) return;
        setAnime(data);
        const list = await getDefaultPlaybackProvider().getEpisodes(
          data.id,
          data.episodes,
          data.title.english || data.title.romaji || undefined,
          data.streamingEpisodes,
          data.bannerImage,
          data.coverImage,
          data.status,
          data.latestAiredEpisode
        );
        if (active) setEpisodes(list);
      } finally {
        if (active) setLoading(false);
      }
    }
    if (validAnimeId) load();
    return () => { active = false; };
  }, [animeId, validAnimeId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080A0D]">
        <div className="relative min-h-[520px] overflow-hidden">
          <Skeleton className="absolute inset-0 rounded-none" />
          <div className="relative mx-auto flex max-w-[1360px] items-end gap-8 px-6 pb-12 pt-24">
            <Skeleton className="hidden aspect-[2/3] w-56 shrink-0 rounded-xl sm:block" />
            <div className="w-full max-w-2xl space-y-4">
              <Skeleton className="h-5 w-52 rounded" />
              <Skeleton className="h-14 w-4/5 rounded" />
              <Skeleton className="h-5 w-44 rounded" />
              <Skeleton className="h-20 w-full rounded" />
              <div className="flex gap-3"><Skeleton className="h-12 w-44 rounded-lg" /><Skeleton className="h-12 w-36 rounded-lg" /></div>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-[1360px] space-y-4 px-6 pt-8">
          <Skeleton className="h-12 w-full rounded" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }
  if (!anime) return <div className="min-h-[60vh] grid place-items-center text-white/60">Anime not found.</div>;

  const savedEpisode = getAnimeWatchProgress(anime.id)?.episode;
  const latestEpisode = anime.latestAiredEpisode || episodes.at(-1)?.number || 1;
  const continueEpisode = savedEpisode && episodes.some((episode) => episode.number === savedEpisode)
    ? savedEpisode
    : latestEpisode;
  return (
    <main className="min-h-screen bg-[#080A0D] text-[#F5F7FA] pb-16">
      <AnimeHero
        anime={anime}
        currentEpisode={continueEpisode}
        onWatchClick={() => router.push(`/anime/${anime.id}?ep=${continueEpisode}`)}
      />

      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 mt-8">
        <DetailsTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          episodeCount={episodes.length}
          characterCount={anime.characters?.length}
          relatedCount={(anime.relations?.length || 0) + (anime.recommendations?.length || 0)}
        />
        {activeTab === "overview" && <Overview anime={anime} />}
        {activeTab === "episodes" && (
          <EpisodeSection anime={anime} episodes={episodes} currentEpisode={continueEpisode} onSelectEpisode={(ep) => router.push(`/anime/${anime.id}?ep=${ep}`)} />
        )}
        {activeTab === "characters" && <CharactersList characters={anime.characters} />}
        {activeTab === "related" && <RelatedList relations={anime.relations} recommendations={anime.recommendations} />}
      </section>
    </main>
  );
}
