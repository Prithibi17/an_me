import React from "react";
import { redirect } from "next/navigation";
import { getFullAnimeCatalogPage, getRecentlyAiredAnime, getTopRatedAnime, getTrendingAnime, searchAnime } from "@/lib/anilist/client";
import type { AnimePageResult } from "@/lib/anilist/types";
import { BrowseListing } from "@/components/search/BrowseListing";
import { enrichAnimeAvailability } from "@/lib/anikoto/client";
import { enrichAnimeWithTmdb } from "@/lib/tmdb/client";

export const revalidate = 180;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function FilterPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const parsedPage = parseInt(params.page || "1", 10);
  const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
  const sort = params.view === "new" ? "START_DATE_DESC" : params.sort || "TRENDING_DESC";
  const genres = params.genres ? params.genres.split(",").filter(Boolean) : undefined;
  const format = params.type && params.type !== "All" ? (params.type as any) : undefined;
  const status = params.status && params.status !== "All" ? params.status : undefined;
  const season = params.season && params.season !== "All" ? (params.season as any) : undefined;
  const today = Number(new Date().toISOString().slice(0, 10).replaceAll("-", ""));

  let score: number | undefined;
  if (params.score && params.score !== "All") {
    if (params.score.includes("10")) score = 90;
    else if (params.score.includes("9")) score = 80;
    else if (params.score.includes("8")) score = 75;
    else if (params.score.includes("7")) score = 70;
    else if (params.score.includes("6")) score = 60;
    else if (params.score.includes("5")) score = 50;
  }

  const dataPromise: Promise<AnimePageResult> = params.view === "latest"
    ? getFullAnimeCatalogPage(page, 36)
    : searchAnime({
    query: params.q?.trim() || undefined,
    sort: (params.view === "latest" ? "START_DATE_DESC" : sort) as any,
    genres,
    format,
    status,
    season,
    score,
    startDate_lesser: params.view === "new" ? today : undefined,
    page,
    perPage: params.view === "latest" ? 36 : 24,
    });

  // Resolve the primary listing first. On shared/serverless IPs this prevents
  // optional sidebar requests from consuming AniList's rate allowance before
  // the content the user actually opened.
  const initialData = await dataPromise;
  const [rawToday, rawWeek, rawMonth] = await Promise.all([
    getRecentlyAiredAnime(1, 10),
    getTrendingAnime(1, 10),
    getTopRatedAnime(1, 10),
  ]);
  if (initialData.media.length === 0 && page > initialData.pageInfo.lastPage) redirect(`/search?view=${params.view || "latest"}&page=${initialData.pageInfo.lastPage}`);
  const enriched = await enrichAnimeAvailability([...initialData.media, ...rawToday, ...rawWeek, ...rawMonth]);
  const byId = new Map(enriched.map((anime) => [anime.id, anime]));
  initialData.media = initialData.media
    .map((anime) => byId.get(anime.id) || anime);
  const mapEnriched = (items: typeof rawWeek) => items.map((anime) => byId.get(anime.id) || anime);
  const topSource = [...mapEnriched(rawToday), ...mapEnriched(rawWeek), ...mapEnriched(rawMonth)];
  const posterItems = await Promise.all(
    Array.from(new Map(topSource.map((anime) => [anime.id, anime])).values())
      .map((anime) => enrichAnimeWithTmdb(anime, { posterOnly: true })),
  );
  const posterById = new Map(posterItems.map((anime) => [anime.id, anime]));
  const withTmdbPoster = (items: typeof rawWeek) => items.map((anime) => posterById.get(anime.id) || anime);
  const topAnime = {
    today: withTmdbPoster(mapEnriched(rawToday)),
    week: withTmdbPoster(mapEnriched(rawWeek)),
    month: withTmdbPoster(mapEnriched(rawMonth)),
  };

  return (
    <BrowseListing data={initialData} params={params} topAnime={topAnime} />
  );
}
