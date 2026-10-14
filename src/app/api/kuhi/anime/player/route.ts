import { NextRequest, NextResponse } from "next/server";
import { getKuhiAnimePlayer } from "@/lib/kuhi/client";

export async function GET(request: NextRequest) {
  const animeId = Number(request.nextUrl.searchParams.get("animeId"));
  const episode = Number(request.nextUrl.searchParams.get("episode"));
  const audio = request.nextUrl.searchParams.get("audio") === "dub" ? "dub" : "sub";
  if (!Number.isInteger(animeId) || animeId <= 0 || !Number.isFinite(episode) || episode <= 0) {
    return NextResponse.json({ error: "Invalid anime or episode" }, { status: 400 });
  }
  const result = await getKuhiAnimePlayer(animeId, episode, audio);
  if (!result?.player_url) {
    return NextResponse.json({ error: "Server 4 is unavailable for this episode" }, { status: 404 });
  }
  return NextResponse.json({ playerUrl: result.player_url }, {
    headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" },
  });
}
