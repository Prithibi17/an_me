import { NextRequest, NextResponse } from "next/server";

const cache = new Map<string, { expires: number; sub: number[]; dub: number[] }>();
const KEY = "otaku-embed-v1";

function decodePayload(html: string) {
  const blob = html.match(/window\.__P="([^"]+)"/)?.[1];
  if (!blob) return null;
  const input = Buffer.from(blob, "base64").toString("binary");
  let output = "";
  for (let index = 0; index < input.length; index++) {
    output += String.fromCharCode(input.charCodeAt(index) ^ KEY.charCodeAt(index % KEY.length));
  }
  try { return JSON.parse(Buffer.from(output, "binary").toString("utf8")); } catch { return null; }
}

async function available(animeId: number, episode: number, track: "sub" | "dub") {
  try {
    const response = await fetch(`https://zokoanime.video/stream/ani/${animeId}/${episode}/${track}`, {
      headers: { "User-Agent": "Anme/1.0" }, signal: AbortSignal.timeout(8000), cache: "no-store",
    });
    if (!response.ok) return false;
    const payload = decodePayload(await response.text());
    return Boolean(payload?.src);
  } catch { return false; }
}

export async function GET(request: NextRequest) {
  const animeId = Number(request.nextUrl.searchParams.get("animeId"));
  const count = Math.min(100, Number(request.nextUrl.searchParams.get("count")));
  if (!Number.isInteger(animeId) || animeId < 1 || !Number.isInteger(count) || count < 1) {
    return NextResponse.json({ error: "Invalid anime or episode count." }, { status: 400 });
  }
  const key = `${animeId}:${count}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return NextResponse.json({ sub: cached.sub, dub: cached.dub });

  const sub: number[] = [], dub: number[] = [];
  for (let start = 1; start <= count; start += 10) {
    const numbers = Array.from({ length: Math.min(10, count - start + 1) }, (_, index) => start + index);
    const results = await Promise.all(numbers.flatMap((episode) => [available(animeId, episode, "sub"), available(animeId, episode, "dub")]));
    numbers.forEach((episode, index) => {
      if (results[index * 2]) sub.push(episode);
      if (results[index * 2 + 1]) dub.push(episode);
    });
  }
  cache.set(key, { sub, dub, expires: Date.now() + 10 * 60 * 1000 });
  return NextResponse.json({ sub, dub });
}
