import React from "react";
import { searchAnime } from "@/lib/anilist/client";
import { HiAnimeFilterView } from "@/components/search/HiAnimeFilterView";

export const revalidate = 180;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function FilterPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const sort = params.sort || "TRENDING_DESC";
  const genres = params.genres ? params.genres.split(",").filter(Boolean) : undefined;
  const format = params.type && params.type !== "All" ? (params.type as any) : undefined;
  const status = params.status && params.status !== "All" ? params.status : undefined;
  const season = params.season && params.season !== "All" ? (params.season as any) : undefined;

  let score: number | undefined;
  if (params.score && params.score !== "All") {
    if (params.score.includes("10")) score = 90;
    else if (params.score.includes("9")) score = 80;
    else if (params.score.includes("8")) score = 75;
    else if (params.score.includes("7")) score = 70;
    else if (params.score.includes("6")) score = 60;
    else if (params.score.includes("5")) score = 50;
  }

  const initialData = await searchAnime({
    query: params.q?.trim() || undefined,
    sort: sort as any,
    genres,
    format,
    status,
    season,
    score,
    page,
    perPage: 24,
  });

  return (
    <HiAnimeFilterView
      initialData={initialData}
      initialParams={params}
    />
  );
}
