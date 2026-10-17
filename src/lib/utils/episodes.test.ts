import assert from "node:assert/strict";
import test from "node:test";
import type { Anime } from "../anilist/types.ts";
import { getEpisodeCounts, matchesEpisodeLanguage } from "./episodes.ts";

function anime(overrides: Partial<Anime>): Anime {
  return { id: 1, title: { english: "Test" }, coverImage: "/test.jpg", genres: [], ...overrides };
}

test("newer verified releases prevent stale subtitle counts", () => {
  assert.deepEqual(
    getEpisodeCounts(anime({ latestAiredEpisode: 3, subEpisodeCount: 2, dubEpisodeCount: 1, episodes: 12 })),
    { sub: 3, dub: 1, total: 12 },
  );
});

test("dub is never inferred from subtitle or total counts", () => {
  const item = anime({ status: "FINISHED", episodes: 24 });
  assert.equal(getEpisodeCounts(item).sub, 24);
  assert.equal(getEpisodeCounts(item).dub, 0);
  assert.equal(matchesEpisodeLanguage(item, "DUB"), false);
});

test("language filters use the same counts rendered on cards", () => {
  const item = anime({ latestAiredEpisode: 4, subEpisodeCount: 3, dubEpisodeCount: 2 });
  assert.equal(matchesEpisodeLanguage(item, "SUB"), true);
  assert.equal(matchesEpisodeLanguage(item, "DUB"), true);
  assert.equal(matchesEpisodeLanguage(item, "SUB & DUB"), true);
});
