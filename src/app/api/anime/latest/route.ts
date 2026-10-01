import { NextResponse } from "next/server";
import { getRecentlyAiredAnime } from "@/lib/anilist/client";
import { enrichAnimeAvailability } from "@/lib/anikoto/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await enrichAnimeAvailability(await getRecentlyAiredAnime(1, 12));
  return NextResponse.json(items, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
