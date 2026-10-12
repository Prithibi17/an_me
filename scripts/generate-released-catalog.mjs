import { createReadStream, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createInterface } from "node:readline";

const input = process.argv[2];
const output = resolve(process.argv[3] || "src/data/released-anilist-catalog.json");
if (!input) throw new Error("Pass the anime-offline-database JSONL file path.");

const seasonRank = { WINTER: 1, SPRING: 2, SUMMER: 3, FALL: 4 };
const allowedStatuses = new Set(["FINISHED", "ONGOING", "HIATUS"]);
const adultTags = new Set(["hentai", "pornography"]);
const entries = new Map();
let metadata = null;

const lines = createInterface({ input: createReadStream(input), crlfDelay: Infinity });
for await (const line of lines) {
  const row = JSON.parse(line);
  if (!metadata) {
    metadata = row;
    continue;
  }
  if (!allowedStatuses.has(row.status)) continue;
  if ((row.tags || []).some((tag) => adultTags.has(String(tag).toLowerCase()))) continue;
  const source = (row.sources || []).find((value) => /^https:\/\/anilist\.co\/anime\/\d+\/?$/.test(value));
  if (!source) continue;
  const id = Number(source.match(/\d+\/?$/)?.[0]?.replace("/", ""));
  const year = Number(row.animeSeason?.year) || 0;
  if (!id || !year) continue;
  entries.set(id, { id, year, season: seasonRank[row.animeSeason?.season] || 0 });
}

const ids = [...entries.values()]
  .sort((a, b) => b.year - a.year || b.season - a.season || b.id - a.id)
  .map((entry) => entry.id);

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify({
  source: metadata?.repository,
  sourceUpdatedAt: metadata?.lastUpdate,
  license: metadata?.license,
  generatedAt: new Date().toISOString(),
  ids,
}));
console.log(`Wrote ${ids.length} released AniList IDs to ${output}`);
