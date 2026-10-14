import assert from "node:assert/strict";
import test from "node:test";
import { chooseTmdbSeason } from "./season-match.ts";

const anime = (title: string, seasonYear: number, episodes: number | null = 12) => ({
  title: { english: title },
  seasonYear,
  episodes,
});

const seasons = [
  { season_number: 1, air_date: "2020-01-10", episode_count: 12 },
  { season_number: 2, air_date: "2024-01-10", episode_count: 12 },
];

test("unnumbered sequel selects the season matching its release year", () => {
  assert.equal(chooseTmdbSeason(anime("Example: The Return", 2024), seasons), 2);
});

test("first installment cannot borrow a later season poster", () => {
  assert.equal(chooseTmdbSeason(anime("Example", 2020), seasons), 1);
});

test("explicit season is rejected when its release year disagrees", () => {
  assert.equal(chooseTmdbSeason(anime("Example Season 2", 2020), seasons), null);
});

test("ambiguous seasons fall back instead of guessing", () => {
  assert.equal(chooseTmdbSeason({ title: { english: "Example" } }, seasons), null);
});

test("episode-count mismatch rejects a wrong season", () => {
  assert.equal(chooseTmdbSeason(anime("Example Season 2", 2024, 24), seasons), null);
});
