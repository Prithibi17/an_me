import { NextRequest, NextResponse } from "next/server";
import { getAnimeDetails } from "@/lib/anilist/client";
import { getJikanAnime } from "@/lib/jikan/client";
import { getAnikotoAnimeMetadata } from "@/lib/anikoto/client";
import { applyEpisodeAvailability, mergeAnimeMetadata } from "@/lib/data/decision";
import { enrichAnimeWithTmdb } from "@/lib/tmdb/client";

export async function GET(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid AniList ID." }, { status: 400 });
  }
  const anime = await getAnimeDetails(id);
  if (!anime) return NextResponse.json({ error: "Anime not found." }, { status: 404 });
  if (request.nextUrl.searchParams.get("core") === "1") {
    return NextResponse.json({ anime }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  }

  const [jikan, anikoto, tmdbAnime] = await Promise.all([
    anime.idMal ? getJikanAnime(anime.idMal) : Promise.resolve(null),
    getAnikotoAnimeMetadata(anime.id),
    enrichAnimeWithTmdb(anime, { includeEpisodeStills: true }),
  ]);
  const merged = applyEpisodeAvailability(mergeAnimeMetadata(anime, jikan), anikoto);
  const enriched = {
    ...merged,
    coverImage: tmdbAnime.coverImage,
    bannerImage: tmdbAnime.bannerImage,
    titleLogo: tmdbAnime.titleLogo,
    trailer: tmdbAnime.trailer,
    streamingEpisodes: tmdbAnime.streamingEpisodes,
    tmdb: tmdbAnime.tmdb,
    dataSources: Array.from(new Set([...(merged.dataSources || []), ...(tmdbAnime.dataSources || [])])),
  };
  return NextResponse.json({ anime: enriched }, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
