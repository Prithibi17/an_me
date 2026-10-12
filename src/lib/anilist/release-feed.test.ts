import assert from "node:assert/strict";
import test from "node:test";
import { selectLatestVerifiedSchedules } from "./release-feed.ts";

const media = (id: number, title = `Anime ${id}`) => ({ id, title: { english: title } });

test("newest verified release wins regardless of anime status", () => {
  const result = selectLatestVerifiedSchedules([
    { id: 1, airingAt: 100, episode: 12, media: media(10, "Completed") },
    { id: 2, airingAt: 90, episode: 3, media: media(20, "Airing") },
  ], 110);
  assert.deepEqual(result.map((item) => item.media?.id), [10, 20]);
});

test("future and invalid episodes are excluded", () => {
  const result = selectLatestVerifiedSchedules([
    { id: 1, airingAt: 120, episode: 1, media: media(10) },
    { id: 2, airingAt: 90, episode: 0, media: media(20) },
    { id: 3, airingAt: 80, episode: 1, media: media(30) },
  ], 100);
  assert.deepEqual(result.map((item) => item.media?.id), [30]);
});

test("cancelled, unreleased, and adult entries are excluded", () => {
  const result = selectLatestVerifiedSchedules([
    { id: 1, airingAt: 90, episode: 1, media: { ...media(10), status: "CANCELLED" } },
    { id: 2, airingAt: 80, episode: 1, media: { ...media(20), status: "NOT_YET_RELEASED" } },
    { id: 3, airingAt: 70, episode: 1, media: { ...media(30), isAdult: true } },
    { id: 4, airingAt: 60, episode: 1, media: { ...media(40), status: "FINISHED" } },
  ], 100);
  assert.deepEqual(result.map((item) => item.media?.id), [40]);
});

test("independent seasons stay separate while duplicate episodes collapse to the latest", () => {
  const result = selectLatestVerifiedSchedules([
    { id: 1, airingAt: 100, episode: 2, media: media(10, "Season 1") },
    { id: 2, airingAt: 90, episode: 1, media: media(10, "Season 1") },
    { id: 3, airingAt: 95, episode: 1, media: media(11, "Season 2") },
  ], 110);
  assert.deepEqual(result.map((item) => [item.media?.id, item.episode]), [[10, 2], [11, 1]]);
});

test("equal timestamps use stable schedule ID ordering", () => {
  const result = selectLatestVerifiedSchedules([
    { id: 4, airingAt: 100, episode: 1, media: media(10) },
    { id: 9, airingAt: 100, episode: 1, media: media(20) },
  ], 110);
  assert.deepEqual(result.map((item) => item.id), [9, 4]);
});
