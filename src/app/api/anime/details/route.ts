import { NextRequest, NextResponse } from "next/server";
import { getAnimeDetails } from "@/lib/anilist/client";
import { getJikanAnime } from "@/lib/jikan/client";
import { getAnikotoAnimeMetadata } from "@/lib/anikoto/client";
import { applyEpisodeAvailability, mergeAnimeMetadata } from "@/lib/data/decision";
import { enrichAnimeWithTmdb } from "@/lib/tmdb/client";
import type { Anime } from "@/lib/anilist/types";

const enrichedCache = new Map<string, { anime: Anime; expiresAt: number }>();
const pendingEnrichment = new Map<string, Promise<Anime | null>>();

export async function GET(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid AniList ID." }, { status: 400 });
  }
  if (request.nextUrl.searchParams.get("core") === "1") {
    const anime = await getAnimeDetails(id);
    if (!anime) return NextResponse.json({ error: "Anime not found." }, { status: 404 });
    return NextResponse.json({ anime }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  }

  const includeEpisodeStills = request.nextUrl.searchParams.get("episodeStills") !== "0";
  const cacheKey = `${id}:${includeEpisodeStills ? "full" : "details"}`;
  const cached = enrichedCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ anime: cached.anime }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  }

  let enrichment = pendingEnrichment.get(cacheKey);
  if (!enrichment) {
    enrichment = (async () => {
      const anime = await getAnimeDetails(id);
      if (!anime) return null;
      const [jikan, anikoto, tmdbAnime] = await Promise.all([
        anime.idMal ? getJikanAnime(anime.idMal) : Promise.resolve(null),
        getAnikotoAnimeMetadata(anime.id),
        enrichAnimeWithTmdb(anime, { includeEpisodeStills }),
      ]);
      const merged = applyEpisodeAvailability(mergeAnimeMetadata(anime, jikan), anikoto);
      return {
        ...merged,
        coverImage: tmdbAnime.coverImage,
        bannerImage: tmdbAnime.bannerImage,
        titleLogo: tmdbAnime.titleLogo,
        trailer: tmdbAnime.trailer,
        streamingEpisodes: tmdbAnime.streamingEpisodes,
        tmdb: tmdbAnime.tmdb,
        dataSources: Array.from(new Set([...(merged.dataSources || []), ...(tmdbAnime.dataSources || [])])),
      } satisfies Anime;
    })().finally(() => pendingEnrichment.delete(cacheKey));
    pendingEnrichment.set(cacheKey, enrichment);
  }
  const enriched = await enrichment;
  if (!enriched) return NextResponse.json({ error: "Anime not found." }, { status: 404 });
  enrichedCache.set(cacheKey, { anime: enriched, expiresAt: Date.now() + 5 * 60 * 1000 });
  return NextResponse.json({ anime: enriched }, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
