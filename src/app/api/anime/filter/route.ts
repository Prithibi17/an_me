import { NextRequest, NextResponse } from "next/server";
import { searchAnime } from "@/lib/anilist/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q") || undefined;
    const format = searchParams.get("type") && searchParams.get("type") !== "All"
      ? (searchParams.get("type") as any)
      : undefined;
    const status = searchParams.get("status") && searchParams.get("status") !== "All"
      ? searchParams.get("status")!
      : undefined;
    const season = searchParams.get("season") && searchParams.get("season") !== "All"
      ? (searchParams.get("season") as any)
      : undefined;
    const sort = searchParams.get("sort") || "TRENDING_DESC";
    const genres = searchParams.get("genres")
      ? searchParams.get("genres")!.split(",").filter(Boolean)
      : undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const scoreStr = searchParams.get("score");

    let score: number | undefined;
    if (scoreStr && scoreStr !== "All") {
      if (scoreStr.includes("10")) score = 90;
      else if (scoreStr.includes("9")) score = 80;
      else if (scoreStr.includes("8")) score = 75;
      else if (scoreStr.includes("7")) score = 70;
      else if (scoreStr.includes("6")) score = 60;
      else if (scoreStr.includes("5")) score = 50;
    }

    let startDate_greater: number | undefined;
    const sy = searchParams.get("sy");
    if (sy) {
      const y = parseInt(sy, 10);
      const m = parseInt(searchParams.get("sm") || "1", 10);
      const d = parseInt(searchParams.get("sd") || "1", 10);
      startDate_greater = y * 10000 + m * 100 + d;
    }

    let startDate_lesser: number | undefined;
    const ey = searchParams.get("ey");
    if (ey) {
      const y = parseInt(ey, 10);
      const m = parseInt(searchParams.get("em") || "12", 10);
      const d = parseInt(searchParams.get("ed") || "28", 10);
      startDate_lesser = y * 10000 + m * 100 + d;
    }

    const perPage = searchParams.get("perPage")
      ? Math.min(Math.max(parseInt(searchParams.get("perPage")!, 10) || 24, 1), 50)
      : 24;

    const data = await searchAnime({
      query,
      format,
      status,
      season,
      score,
      startDate_greater,
      startDate_lesser,
      genres,
      sort: sort as any,
      page,
      perPage,
    });

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Filter API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch anime", pageInfo: { total: 0, currentPage: 1, perPage: 24, lastPage: 1, hasNextPage: false }, media: [] },
      { status: 500 }
    );
  }
}
