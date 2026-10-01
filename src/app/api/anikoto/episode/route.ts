import { NextRequest, NextResponse } from "next/server";
import { getAnikotoEpisodeSource } from "@/lib/anikoto/client";

export async function GET(request: NextRequest) {
  const animeId = Number(request.nextUrl.searchParams.get("animeId"));
  const episode = Number(request.nextUrl.searchParams.get("episode"));
  if (!Number.isInteger(animeId) || animeId < 1 || !Number.isInteger(episode) || episode < 1) {
    return NextResponse.json({ error: "Invalid anime or episode." }, { status: 400 });
  }

  const source = await getAnikotoEpisodeSource(animeId, episode);
  return NextResponse.json({ source }, {
    headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=21600" },
  });
}
