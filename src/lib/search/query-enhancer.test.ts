import assert from "node:assert/strict";
import test from "node:test";
import { deterministicCorrections, editDistance } from "./query-heuristics.ts";

test("measures simple title typos", () => {
  assert.equal(editDistance("narotu", "naruto"), 2);
  assert.equal(editDistance("piece", "piece"), 0);
});

test("corrects common misspelled anime and manga title words", () => {
  assert.deepEqual(deterministicCorrections("narotu"), ["naruto"]);
  assert.deepEqual(deterministicCorrections("one peice"), ["one piece"]);
  assert.deepEqual(deterministicCorrections("jujutsu kaisen"), []);
});
