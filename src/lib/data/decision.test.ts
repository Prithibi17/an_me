import assert from "node:assert/strict";
import test from "node:test";
import type { Anime } from "../anilist/types.ts";
import { applyEpisodeAvailability } from "./decision.ts";

const base: Anime = {
  id: 202250,
  title: { english: "Magic Repo Man" },
  coverImage: "/poster.jpg",
  genres: [],
  latestAiredEpisode: 3,
};

test("availability enrichment cannot lower a newer verified subtitle release", () => {
  const result = applyEpisodeAvailability(base, {
    provider: "Anikoto",
    episodes: null,
    latestAiredEpisode: 2,
    dubbedEpisodes: 0,
    status: "RELEASING",
  });
  assert.equal(result.latestAiredEpisode, 3);
  assert.equal(result.subEpisodeCount, 3);
  assert.equal(result.dubEpisodeCount, 0);
});
