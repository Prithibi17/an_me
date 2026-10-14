import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const value = request.nextUrl.searchParams.get("url");
  if (!value) return NextResponse.json({ error: "Missing image URL" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(value);
  } catch {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }
  if (target.protocol !== "https:" || !target.hostname.endsWith(".mangadex.network")) {
    return NextResponse.json({ error: "Image host is not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(target, {
      headers: { Referer: "https://mangadex.org/", "User-Agent": "Anme/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Image is unavailable" }, { status: 502 });
    }
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image request failed" }, { status: 502 });
  }
}
