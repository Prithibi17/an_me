import React from "react";
import { redirect } from "next/navigation";
import { getTrendingAnime, searchAnime } from "@/lib/anilist/client";
import type { AnimePageResult } from "@/lib/anilist/types";
import { BrowseListing } from "@/components/search/BrowseListing";
import { enrichAnimeAvailability } from "@/lib/anikoto/client";

export const revalidate = 180;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function FilterPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
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
    ? searchAnime({
        sort: "UPDATED_AT_DESC",
        startDate_lesser: today,
        page,
        perPage: 24,
      })
    : searchAnime({
    query: params.q?.trim() || undefined,
    sort: sort as any,
    genres,
    format,
    status,
    season,
    score,
    startDate_lesser: params.view === "new" ? today : undefined,
    page,
    perPage: 24,
  });

  const [initialData, rawTopAnime] = await Promise.all([dataPromise, getTrendingAnime(1, 10)]);
  if (params.view === "latest" && initialData.media.length === 0 && page > initialData.pageInfo.lastPage) {
    const corrected = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value && key !== "page") corrected.set(key, value);
    });
    corrected.set("page", String(initialData.pageInfo.lastPage));
    redirect(`/search?${corrected.toString()}`);
  }
  const enriched = await enrichAnimeAvailability([...initialData.media, ...rawTopAnime]);
  const byId = new Map(enriched.map((anime) => [anime.id, anime]));
  initialData.media = initialData.media
    .map((anime) => byId.get(anime.id) || anime);
  const topAnime = rawTopAnime.map((anime) => byId.get(anime.id) || anime);

  return (
    <BrowseListing data={initialData} params={params} topAnime={topAnime} />
  );
}
