"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAnimeDetails } from "@/lib/anilist/client";
import type { Anime } from "@/lib/anilist/types";
import { getDefaultPlaybackProvider, type EpisodeItem } from "@/lib/providers";
import { getAnimeWatchProgress } from "@/lib/storage/watch-history";
import { getPreferredTitle } from "@/lib/utils/title";
import { AnimeHero } from "@/components/details/AnimeHero";
import { CharactersList } from "@/components/details/CharactersList";
import { DetailsTabs, type DetailTab } from "@/components/details/DetailsTabs";
import { EpisodeSection } from "@/components/details/EpisodeSection";
import { Overview } from "@/components/details/Overview";
import { RelatedList } from "@/components/details/RelatedList";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AnimeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const animeId = Number(id);
  const router = useRouter();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await getAnimeDetails(animeId);
        if (!data || !active) return;
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
    if (Number.isFinite(animeId) && animeId > 0) load();
    else setLoading(false);
    return () => { active = false; };
  }, [animeId]);

  if (loading) {
    return <div className="max-w-[1360px] mx-auto p-6"><Skeleton className="w-full h-[520px] rounded-xl" /></div>;
  }
  if (!anime) return <div className="min-h-[60vh] grid place-items-center text-white/60">Anime not found.</div>;

  const savedEpisode = getAnimeWatchProgress(anime.id)?.episode;
  const latestEpisode = anime.latestAiredEpisode || episodes.at(-1)?.number || 1;
  const continueEpisode = savedEpisode && episodes.some((episode) => episode.number === savedEpisode)
    ? savedEpisode
    : latestEpisode;
  const title = getPreferredTitle(anime.title);

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
