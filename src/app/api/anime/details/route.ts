import { NextRequest, NextResponse } from "next/server";
import { getAnimeDetails } from "@/lib/anilist/client";
import { getJikanAnime } from "@/lib/jikan/client";
import { getAnikotoAnimeMetadata } from "@/lib/anikoto/client";
import { applyEpisodeAvailability, mergeAnimeMetadata } from "@/lib/data/decision";

export async function GET(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid AniList ID." }, { status: 400 });
  }
  const anime = await getAnimeDetails(id);
  if (!anime) return NextResponse.json({ error: "Anime not found." }, { status: 404 });

  const [jikan, anikoto] = await Promise.all([
    anime.idMal ? getJikanAnime(anime.idMal) : Promise.resolve(null),
    getAnikotoAnimeMetadata(anime.id),
  ]);
  const merged = applyEpisodeAvailability(mergeAnimeMetadata(anime, jikan), anikoto);
  return NextResponse.json({ anime: merged }, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
