import { NextRequest, NextResponse } from "next/server";
import { getMangaList } from "@/lib/anilist/manga";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  const perPage = Math.min(12, Math.max(1, Number(request.nextUrl.searchParams.get("perPage")) || 6));
  if (!query) return NextResponse.json({ media: [] });
  const result = await getMangaList({ search: query, sort: ["SEARCH_MATCH"], perPage });
  return NextResponse.json(result, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
