import { NextResponse } from "next/server";
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
      minItems: 8,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "category", "publishedAt", "summary", "sourceName", "sourceUrl"],
        properties: {
          title: { type: "string", minLength: 8, maxLength: 180 },
          category: { type: "string", enum: ["Announcements", "Trailers", "Production", "Broadcast"] },
          publishedAt: { type: "string", description: "ISO 8601 date or date-time copied from the source" },
          summary: { type: "string", minLength: 30, maxLength: 420 },
          sourceName: { type: "string", minLength: 2, maxLength: 100 },
          sourceUrl: { type: "string", format: "uri" },
        },
      },
    },
  },
};

let cachedDigest: { items: LiveAnimeNewsItem[]; generatedAt: string; expiresAt: number } | null = null;

export async function GET() {
  if (!isOpenRouterConfigured()) {
    return NextResponse.json({ error: "Live AI news is not configured." }, { status: 503 });
  }

  if (cachedDigest && cachedDigest.expiresAt > Date.now()) {
    return NextResponse.json({ items: cachedDigest.items, generatedAt: cachedDigest.generatedAt }, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const result = await requestOpenRouterJson<{ items: LiveAnimeNewsItem[] }>({
      model: process.env.OPENROUTER_NEWS_MODEL || "google/gemini-2.5-flash-lite",
      schemaName: "anime_news_digest",
      schema: NEWS_SCHEMA,
      maxTokens: 6_500,
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
          content: `Today is ${today}. Find 10 important anime news stories published in the last 21 days. Cover a useful mix of announcements, trailers, production updates, and broadcast news. Each item must link directly to the exact source article that supports it. Summaries must distinguish confirmed facts from plans and schedules.`,
        },
      ],
    });

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
    cachedDigest = { items, generatedAt, expiresAt: Date.now() + 30 * 60 * 1000 };
    return NextResponse.json({ items, generatedAt }, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });
  } catch (error) {
    console.error("OpenRouter anime news failed:", error);
    return NextResponse.json({ error: "Live anime news is temporarily unavailable." }, { status: 502 });
  }
}
