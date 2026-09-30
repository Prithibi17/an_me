import { NextRequest, NextResponse } from "next/server";
import { getAnimeDetails } from "@/lib/anilist/client";
import { getJikanAnime } from "@/lib/jikan/client";
import { mergeAnimeMetadata } from "@/lib/data/decision";

export async function GET(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid AniList ID." }, { status: 400 });
  }
  const anime = await getAnimeDetails(id);
  if (!anime) return NextResponse.json({ error: "Anime not found." }, { status: 404 });

  const jikan = anime.idMal ? await getJikanAnime(anime.idMal) : null;
  return NextResponse.json({ anime: mergeAnimeMetadata(anime, jikan) }, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
