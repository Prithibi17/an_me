import { NextRequest, NextResponse } from "next/server";
import { isOpenRouterConfigured, requestOpenRouterJson } from "@/lib/openrouter/client";

export const dynamic = "force-dynamic";

export interface LiveAnimeNewsItem {
  title: string;
  category: "Announcements" | "Trailers" | "Production" | "Broadcast";
  publishedAt: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
}

const NEWS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      minItems: 1,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "category", "publishedAt", "summary", "sourceName", "sourceUrl"],
        properties: {
          title: { type: "string", minLength: 8, maxLength: 180 },
          category: { type: "string", enum: ["Announcements", "Trailers", "Production", "Broadcast"] },
          publishedAt: { type: "string", description: "ISO 8601 date or date-time copied from the source" },
          summary: { type: "string", minLength: 30, maxLength: 240 },
          sourceName: { type: "string", minLength: 2, maxLength: 100 },
          sourceUrl: { type: "string", format: "uri" },
        },
      },
    },
  },
};

const cachedDigests = new Map<number, { items: LiveAnimeNewsItem[]; generatedAt: string; expiresAt: number }>();

export async function GET(request: NextRequest) {
  if (!isOpenRouterConfigured()) {
    return NextResponse.json({ error: "Live AI news is not configured." }, { status: 503 });
  }

  const requestedPage = Number.parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
  const page = Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), 500) : 1;
  const cachedDigest = cachedDigests.get(page);
  if (cachedDigest && cachedDigest.expiresAt > Date.now()) {
    return NextResponse.json({ items: cachedDigest.items, generatedAt: cachedDigest.generatedAt, page }, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });
  }

  try {
    const windowEnd = new Date();
    windowEnd.setUTCDate(windowEnd.getUTCDate() - ((page - 1) * 21));
    const windowStart = new Date(windowEnd);
    windowStart.setUTCDate(windowStart.getUTCDate() - 20);
    const startDate = windowStart.toISOString().slice(0, 10);
    const endDate = windowEnd.toISOString().slice(0, 10);
    const fetchDigest = () => requestOpenRouterJson<{ items: LiveAnimeNewsItem[] }>({
        model: process.env.OPENROUTER_NEWS_MODEL || "google/gemini-2.5-flash-lite",
        schemaName: "anime_news_digest",
        schema: NEWS_SCHEMA,
        maxTokens: 1_500,
        // The web plugin performs one deterministic search pass before the model
        // writes the schema response. The server tool can leave some routed models
        // at an intermediate "I'll search" message instead of returning the digest.
        plugins: [{ id: "web", max_results: 20 }, { id: "response-healing" }],
        messages: [
          {
            role: "system",
            content: "You are the news desk for an anime streaming website. Return only verified anime industry news. Never invent announcements, dates, studios, release schedules, quotes, or URLs. Prefer official anime sites, studios, publishers, distributors, and established anime newsrooms such as Anime News Network, Crunchyroll News, ORICON, and official Japanese production sites. Exclude rumors, database-only AniList metadata updates, and duplicate coverage. Use a diverse mix of sources and include no more than three stories from the same domain.",
          },
          {
            role: "user",
            content: `Find the important, independently verified anime news stories published from ${startDate} through ${endDate}, returning up to 12. The item count must reflect how many valid stories are actually available; do not target a fixed count and do not pad the response. Cover announcements, trailers, production updates, and broadcast news. Each item must link directly to the exact source article that supports it. Summaries must distinguish confirmed facts from plans and schedules.`,
          },
        ],
      });
    let result: { items: LiveAnimeNewsItem[] };
    try {
      result = await fetchDigest();
    } catch {
      // Some providers occasionally finish the web search without emitting the
      // structured answer. Retry once before returning an unavailable state.
      result = await fetchDigest();
    }

    const items = result.items.filter((item) => {
      try {
        const url = new URL(item.sourceUrl);
        return url.protocol === "https:" && Boolean(Date.parse(item.publishedAt));
      } catch {
        return false;
      }
    });
    if (items.length === 0) throw new Error("No source-verified news items were returned.");

    const generatedAt = new Date().toISOString();
    cachedDigests.set(page, { items, generatedAt, expiresAt: Date.now() + 30 * 60 * 1000 });
    return NextResponse.json({ items, generatedAt, page }, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });
  } catch (error) {
    console.error("OpenRouter anime news failed:", error);
    return NextResponse.json({ error: "Live anime news is temporarily unavailable." }, { status: 502 });
  }
}
