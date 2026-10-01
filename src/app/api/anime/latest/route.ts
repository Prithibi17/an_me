import { NextResponse } from "next/server";
import { getRecentlyAiredAnime } from "@/lib/anilist/client";
import { enrichAnimeAvailability } from "@/lib/anikoto/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const enriched = await enrichAnimeAvailability(await getRecentlyAiredAnime(1, 18));
  const items = enriched.filter((anime) => anime.subEpisodeCount !== 0).slice(0, 12);
  return NextResponse.json(items, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
