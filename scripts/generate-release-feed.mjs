import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const endpoint = "https://graphql.anilist.co";
const output = resolve(process.argv[2] || "src/data/anilist-release-feed.json");
const delay = (ms) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms));

async function request(query, variables, attempt = 0) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (response.status === 429 && attempt < 5) {
    const retryAfter = Number(response.headers.get("retry-after"));
    await delay(Number.isFinite(retryAfter) ? Math.min(retryAfter * 1000, 60_000) : 5_000 * (attempt + 1));
    return request(query, variables, attempt + 1);
  }
  if (!response.ok) throw new Error(`AniList ${response.status}: ${await response.text()}`);
  const body = await response.json();
  if (body.errors?.length) throw new Error(body.errors[0].message);
  return body.data;
}

const byMediaId = new Map();
let cursor = Math.floor(Date.now() / 1000);
let requestCount = 0;

function allowedMedia(media) {
  if (!media || media.isAdult || media.status === "CANCELLED" || media.status === "NOT_YET_RELEASED" || media.format === "MUSIC") return false;
  const tags = new Set((media.tags || []).map((tag) => tag.name));
  if (["Advertisement", "Commercial", "Educational", "Kids", "Promotional Video", "Recap", "Trailer"].some((tag) => tags.has(tag))) return false;
  if (typeof media.duration === "number" && media.duration < 5) return false;
  const animalShort = (tags.has("Animals") || tags.has("Primarily Animal Cast")) &&
    (media.format === "TV_SHORT" || (media.format === "ONA" && typeof media.duration === "number" && media.duration <= 15));
  const verticalMicro = typeof media.duration === "number" && media.duration <= 2 && tags.has("Vertical Video");
  return !animalShort && !verticalMicro;
}

for (;;) {
  let schedulesInWindow = 0;
  let oldest = cursor;
  for (let startPage = 1; startPage <= 100; startPage += 10) {
    const pages = Array.from({ length: 10 }, (_, index) => startPage + index);
    const fields = pages.map((page) => `
      p${page}: Page(page: ${page}, perPage: 50) {
        airingSchedules(airingAt_lesser: $before, sort: TIME_DESC) {
          id airingAt episode media { id status isAdult format duration tags { name } title { english romaji } }
        }
      }
    `).join("\n");
    const data = await request(`query ReleaseWindow($before: Int) { ${fields} }`, { before: cursor });
    requestCount += 1;
    let batchCount = 0;
    for (const page of pages) {
      for (const row of data[`p${page}`]?.airingSchedules || []) {
        batchCount += 1;
        schedulesInWindow += 1;
        oldest = Math.min(oldest, row.airingAt || oldest);
        if (!row.media?.id || !allowedMedia(row.media)) continue;
        if (!Number.isInteger(row.episode) || row.episode < 1 || !Number.isInteger(row.airingAt) || row.airingAt >= cursor) continue;
        if (!row.media.title?.english && !row.media.title?.romaji) continue;
        const existing = byMediaId.get(row.media.id);
        if (!existing || row.airingAt > existing.airingAt || (row.airingAt === existing.airingAt && row.id > existing.scheduleId)) {
          byMediaId.set(row.media.id, { mediaId: row.media.id, episode: row.episode, airingAt: row.airingAt, scheduleId: row.id });
        }
      }
    }
    process.stdout.write(`\r${byMediaId.size} installments, ${requestCount} requests`);
    if (batchCount < 500) break;
    await delay(700);
  }
  if (schedulesInWindow < 5000 || oldest >= cursor) break;
  cursor = oldest;
}

const releases = [...byMediaId.values()].sort((a, b) => b.airingAt - a.airingAt || b.scheduleId - a.scheduleId);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify({ generatedAt: new Date().toISOString(), source: "AniList AiringSchedule", releases }));
console.log(`\nWrote ${releases.length} verified installment releases to ${output}`);
