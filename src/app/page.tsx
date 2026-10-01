import React from "react";
import {
  getTrendingAnime,
  getPopularSeasonAnime,
  getTopRatedAnime,
  getUpcomingAnime,
  getCompletedAnime,
  getRecentlyAiredAnime,
  getAiringSchedule,
  searchAnime,
} from "@/lib/anilist/client";
import { HiAnimeSpotlight } from "@/components/home/HiAnimeSpotlight";
import { HiAnimeTrendingStrip } from "@/components/home/HiAnimeTrendingStrip";
import { HiAnimeFourColumns } from "@/components/home/HiAnimeFourColumns";
import { AnimeSectionGrid } from "@/components/home/AnimeSectionGrid";
import { EstimatedSchedule } from "@/components/home/EstimatedSchedule";
import { GenresCard } from "@/components/home/GenresCard";
import { HiAnimeTop10 } from "@/components/home/HiAnimeTop10";
import { TrendingPosts } from "@/components/home/TrendingPosts";
import { ContinueWatching } from "@/components/home/ContinueWatching";
import { LiveLatestEpisodes } from "@/components/home/LiveLatestEpisodes";
import { enrichAnimeAvailability } from "@/lib/anikoto/client";

export const revalidate = 180; // ISR cache 3 minutes

export default async function HomePage() {
  const today = Number(new Date().toISOString().slice(0, 10).replaceAll("-", ""));
  const [rawTrending, rawPopularSeason, rawTopRated, rawUpcoming, rawCompleted, rawRecentlyAired, newAnimePage, weeklySchedule] =
    await Promise.all([
      getTrendingAnime(1, 10),
      getPopularSeasonAnime(1, 12),
      getTopRatedAnime(1, 10),
      getUpcomingAnime(1, 12),
      getCompletedAnime(1, 10),
      getRecentlyAiredAnime(1, 12),
      searchAnime({ sort: "START_DATE_DESC", startDate_lesser: today, page: 1, perPage: 12 }),
      getAiringSchedule(),
    ]);

  const combined = await enrichAnimeAvailability([
    ...rawTrending, ...rawPopularSeason, ...rawTopRated, ...rawUpcoming,
    ...rawCompleted, ...rawRecentlyAired, ...newAnimePage.media,
  ]);
  const byId = new Map(combined.map((anime) => [anime.id, anime]));
  const enrich = (items: typeof rawTrending) => items.map((anime) => byId.get(anime.id) || anime);
  const trending = enrich(rawTrending);
  const popularSeason = enrich(rawPopularSeason);
  const topRated = enrich(rawTopRated);
  const upcoming = enrich(rawUpcoming);
  const completed = enrich(rawCompleted);
  const recentlyAired = enrich(rawRecentlyAired);
  newAnimePage.media = enrich(newAnimePage.media);

  // Filter spotlight candidates to ensure each item has an official widescreen bannerImage
  const spotlightCandidates = [...trending, ...popularSeason].filter(
    (item, idx, self) =>
      Boolean(item.bannerImage) && self.findIndex((a) => a.id === item.id) === idx
  );
  const spotlightList =
    spotlightCandidates.length >= 5 ? spotlightCandidates.slice(0, 10) : trending;

  return (
    <div className="w-full flex flex-col bg-[#0a0b0e] text-[#F5F7FA]">
      {/* 1. Cinematic Spotlight Hero Carousel */}
      <HiAnimeSpotlight spotlightList={spotlightList} />

      {/* Main Container */}
      <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 flex flex-col gap-3 pt-2">
        {/* Continue Watching (synced with localStorage) */}
        <ContinueWatching />

        {/* 2. Trending Horizontal Strip with Rotated Vertical Ranks */}
        <HiAnimeTrendingStrip items={trending} />

        {/* 3. 4-Column Highlights Row: Top Airing, Most Popular, Most Favorite, Latest Completed */}
        <HiAnimeFourColumns
          topAiring={popularSeason}
          mostPopular={trending}
          mostFavorite={topRated}
          latestCompleted={completed}
        />

        {/* 4. Main 2-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2">
          {/* Left Column (~75% width on desktop) */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
            {/* Latest Episode - Strictly real aired episodes with airingAt <= now */}
            <LiveLatestEpisodes initialItems={recentlyAired} />

            {/* New on An:me */}
            <AnimeSectionGrid
              title="New on An:me"
              items={newAnimePage.media}
              viewMoreHref="/search?view=new"
              isLatestSection={true}
            />

            {/* Estimated Schedule with Day Tabs and Real AniList Airing Timeline */}
            <EstimatedSchedule initialSchedules={weeklySchedule} />

            {/* Top Upcoming - with live countdowns or Schedule not announced */}
            <AnimeSectionGrid
              title="Top Upcoming"
              items={upcoming}
              viewMoreHref="/search?status=NOT_YET_RELEASED&sort=POPULARITY_DESC"
              isUpcomingSection={true}
            />
          </div>

          {/* Right Column (~25% width on desktop) */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
            {/* Genres Filter Card */}
            <GenresCard />

            {/* Top 10 Ranked Widget with Today / Week / Month Tabs */}
            <HiAnimeTop10 animeList={trending} />

            {/* Community Discussions / Trending Posts */}
            <TrendingPosts />
          </div>
        </div>
      </div>
    </div>
  );
}
