import { NextRequest, NextResponse } from "next/server";
import { isOpenRouterConfigured, requestOpenRouterJson } from "@/lib/openrouter/client";

export const dynamic = "force-dynamic";

const buckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(request: NextRequest) {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const bucket = buckets.get(address);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(address, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > 10;
}

const MODERATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["allowed", "reason"],
  properties: {
    allowed: { type: "boolean" },
    reason: { type: "string", maxLength: 180 },
  },
};

export async function POST(request: NextRequest) {
  if (isRateLimited(request)) {
    return NextResponse.json({ error: "Too many moderation requests. Please wait a minute." }, { status: 429 });
  }

  const body = await request.json().catch(() => null) as { title?: unknown; content?: unknown; kind?: unknown } | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const kind = body?.kind === "comment" ? "comment" : "discussion";
  if (!content || content.length > 5_000 || title.length > 240) {
    return NextResponse.json({ error: "Invalid community content." }, { status: 400 });
  }
  if (!isOpenRouterConfigured()) {
    return NextResponse.json({ error: "Community moderation is not configured." }, { status: 503 });
  }

  try {
    const result = await requestOpenRouterJson<{ allowed: boolean; reason: string }>({
      schemaName: "community_moderation",
      schema: MODERATION_SCHEMA,
      maxTokens: 180,
      messages: [
        {
          role: "system",
          content: "Moderate an anime community submission. Allow normal criticism, disagreements, spoilers, fan theories, slang, and mild profanity. Reject only targeted harassment, hateful abuse, sexual content involving minors, explicit sexual solicitation, credible threats, instructions for serious wrongdoing, doxxing/private data, spam, or malicious links. Return a brief user-facing reason when rejected. Do not rewrite the submission.",
        },
        {
          role: "user",
          content: JSON.stringify({ kind, title, content }),
        },
      ],
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("OpenRouter community moderation failed:", error);
    return NextResponse.json({ error: "Community moderation is temporarily unavailable." }, { status: 502 });
  }
}
