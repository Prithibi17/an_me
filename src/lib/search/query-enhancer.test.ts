import assert from "node:assert/strict";
import test from "node:test";
import { deterministicCorrections, editDistance, rankAutocompleteCandidates } from "./query-heuristics.ts";

test("measures simple title typos", () => {
  assert.equal(editDistance("narotu", "naruto"), 2);
  assert.equal(editDistance("piece", "piece"), 0);
});

test("ranks title prefixes before word prefixes and loose matches", () => {
  const items = [
    { id: 1, title: "Miss Kobayashi's Dragon Maid" },
    { id: 2, title: "Dr. Stone" },
    { id: 3, title: "Dragon Ball" },
    { id: 4, title: "The Dragon Prince" },
  ];
  assert.deepEqual(
    rankAutocompleteCandidates("dr", items, (item) => [item.title], 4).map((item) => item.id),
    [2, 3, 1, 4],
  );
});

test("corrects common misspelled anime and manga title words", () => {
  assert.deepEqual(deterministicCorrections("narotu"), ["naruto"]);
  assert.deepEqual(deterministicCorrections("one peice"), ["one piece"]);
  assert.deepEqual(deterministicCorrections("jujutsu kaisen"), []);
});
