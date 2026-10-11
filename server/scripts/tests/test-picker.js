// Unit tests for the picker with small hand-made fixtures. No database or Judge0 needed.  Run: npm run test:picker
import assert from "node:assert/strict";
import { conceptStatus, pickNext, TARGET_SUCCESS } from "../../src/recommend/picker.js";
import { expectedScore } from "../../src/skill/skill.js";

let failures = 0;
const test = (name, fn) => {
  try { fn(); console.log("ok  ", name); } catch (e) { failures++; console.log("FAIL", name, "\n     ", e.message); }
};

// Tiny curriculum:  A (no prerequisites) -> B ;  A -> C ;  B + C -> D ;  E has no problems ;  F needs E
const concepts = [
  { key: "A", name: "Alpha", prerequisites: [] },
  { key: "B", name: "Beta", prerequisites: ["A"] },
  { key: "C", name: "Gamma", prerequisites: ["A"] },
  { key: "D", name: "Delta", prerequisites: ["B", "C"] },
  { key: "E", name: "Empty", prerequisites: [] },
  { key: "F", name: "Follower", prerequisites: ["E"] },
];
const P = (slug, concept, difficulty, rating) => ({ slug, title: slug, concept, difficulty, rating });
const problems = [
  P("a1", "A", "easy", 900), P("a2", "A", "easy", 900), P("a3", "A", "medium", 1200),
  P("b1", "B", "easy", 900), P("b2", "B", "easy", 900),
  P("c1", "C", "easy", 900),
  P("d1", "D", "easy", 900),
  P("f1", "F", "easy", 900),
];
const state = (over = {}) => ({ concepts, problems, difficulty: new Map(), ratings: new Map(), solved: new Set(), exclude: new Set(), ...over });
const slugOf = (r) => r.problem?.slug;

test("a new learner only gets problems from concepts without prerequisites (or with problem-less ones)", () => {
  const status = conceptStatus(state());
  assert.equal(status.get("A").unlocked, true);
  assert.equal(status.get("B").unlocked, false);
  assert.deepEqual(status.get("B").missing, ["A"]);
  assert.equal(status.get("F").unlocked, true, "F's only prerequisite has no problems, so it must not block F");
  assert.equal(status.get("E").solid, true, "a concept with no problems counts as solid");
});
test("first pick for a new learner: easy problem (E = 0.64), from an unlocked concept", () => {
  const r = pickNext(state());
  assert.equal(r.done, false);
  assert.ok(["a1", "a2", "f1"].includes(slugOf(r)), slugOf(r));
  assert.ok(Math.abs(r.expectedSuccess - expectedScore(1000, 900)) < 1e-9);
});
test("a medium problem (E = 0.24) is not picked while easy fits exist", () => {
  assert.notEqual(slugOf(pickNext(state({ solved: new Set() }))), "a3");
});
test("solving 2 of 3 problems in A unlocks B and C", () => {
  const status = conceptStatus(state({ solved: new Set(["a1", "a2"]) }));
  assert.equal(status.get("A").solid, true);
  assert.equal(status.get("B").unlocked, true);
  assert.equal(status.get("C").unlocked, true);
});
test("solving only 1 problem of A does not unlock B", () => {
  assert.equal(conceptStatus(state({ solved: new Set(["a1"]) })).get("B").unlocked, false);
});
test("a concept with a single problem needs only that one solved (min(2, total))", () => {
  const status = conceptStatus(state({ solved: new Set(["a1", "a2", "c1"]) })); // C has 1 problem
  assert.equal(status.get("C").solid, true);
  assert.equal(status.get("D").unlocked, false, "D also needs B");
});
test("D unlocks when B (2 problems) and C (1 problem) are solid", () => {
  const solved = new Set(["a1", "a2", "b1", "b2", "c1"]);
  assert.equal(conceptStatus(state({ solved })).get("D").unlocked, true);
});
test("solved problems are never offered again", () => {
  const solved = new Set(["a1", "a2", "f1"]);
  for (let i = 0; i < 5; i++) assert.ok(!solved.has(slugOf(pickNext(state({ solved })))));
});
test("weakest unlocked concept wins among problems that fit", () => {
  const solved = new Set(["a1", "a2"]); // B, C now open; A has only the medium a3 left
  const ratings = new Map([["B", 1010], ["C", 960], ["A", 1100], ["F", 1050]]);
  const r = pickNext(state({ solved, ratings }));
  assert.equal(slugOf(r), "c1", "C has the lowest rating among concepts with a fitting problem");
  assert.equal(r.mode, "weakest");
  assert.match(r.reason, /Gamma/);
});
test("rating matters: a higher-rated learner is offered the harder problem that now fits", () => {
  // rating 1200 vs medium 1200 -> E = 0.5 (in window); vs easy 900 -> E = 0.85 (outside); only a3 fits in A
  const r = pickNext(state({ ratings: new Map([["A", 1200], ["F", 1200]]), solved: new Set(["f1"]) }));
  assert.equal(slugOf(r), "a3");
});
test("picks the problem closest to 65% inside the chosen concept", () => {
  const difficulty = new Map([["b1", 1000], ["b2", 880]]); // E(1000 vs 1000) = 0.5, E(1000 vs 880) = 0.666
  const r = pickNext(state({ solved: new Set(["a1", "a2", "c1", "f1"]), difficulty, ratings: new Map([["B", 1000]]) }));
  assert.equal(slugOf(r), "b2");
  assert.ok(Math.abs(r.expectedSuccess - TARGET_SUCCESS) < 0.03);
});
test("falls back to the closest problem when nothing is in the window", () => {
  const hard = problems.map((p) => ({ ...p, rating: 1500 }));
  const r = pickNext(state({ problems: hard }));
  assert.equal(r.mode, "closest");
  assert.equal(r.done, false);
});
test("skipped problems are not offered while others remain", () => {
  const first = slugOf(pickNext(state()));
  const second = slugOf(pickNext(state({ exclude: new Set([first]) })));
  assert.notEqual(first, second);
});
test("if everything left was skipped, the picker offers a skipped one again (flagged)", () => {
  const solved = new Set(["a1", "a2", "b1", "b2", "c1", "d1", "f1"]); // only a3 is left
  const r = pickNext(state({ solved, exclude: new Set(["a3"]) }));
  assert.equal(slugOf(r), "a3");
  assert.equal(r.repeated, true);
});
test("done when every open problem is solved", () => {
  const r = pickNext(state({ solved: new Set(problems.map((p) => p.slug)) }));
  assert.equal(r.done, true);
});
test("current (drifted) difficulty is used instead of the seed rating", () => {
  const difficulty = new Map([["a1", 1500], ["a2", 1500], ["f1", 1500]]); // easy problems became very hard
  const r = pickNext(state({ difficulty }));
  assert.ok(Math.abs(r.expectedSuccess - expectedScore(1000, 1500)) > 0.3 || r.mode === "closest");
  assert.notEqual(slugOf(r), "a1");
});

// ---------------------------------------------------------------- Logging v2: candidates, variety picks, propensity
const seq = (...values) => { let i = 0; return () => values[Math.min(i++, values.length - 1)]; }; // a fake random source
test("the result lists the candidates in top-choice order, with counts", () => {
  const r = pickNext(state());
  assert.equal(r.greedySlug, "a1"); assert.equal(r.fitsCount, 3); assert.equal(r.openCount, 4); assert.equal(r.poolSize, 4);
  assert.deepEqual(r.candidates.map((c) => c.slug), ["a1", "a2", "f1"]);
  assert.deepEqual(r.candidates.map((c) => c.greedyRank), [1, 2, 3]);
  assert.ok(Math.abs(r.candidates[0].expectedSuccess - 0.64) < 0.001);
  assert.equal(r.explored, false); assert.equal(r.exploreRate, 0); assert.equal(r.propensity, 1);
});
test("with the variety rate at 0 the pick never changes, whatever the random source says", () => {
  for (const x of [0, 0.5, 0.999]) assert.equal(slugOf(pickNext(state({ explore: { rate: 0, rng: () => x } }))), "a1");
});
test("variety pick: a low random draw chooses uniformly among the good fits, and says so", () => {
  const r = pickNext(state({ explore: { rate: 0.2, rng: seq(0.1, 0.99) } })); // 0.1 < 0.2 -> explore; 0.99 -> the last fit
  assert.equal(slugOf(r), "f1"); assert.equal(r.explored, true); assert.equal(r.greedySlug, "a1");
  assert.equal(r.propensity, 0.067); // rate / 3 fits
  assert.match(r.reason, /variety/i);
});
test("a high random draw keeps the top choice, and its propensity is 1 - rate + rate/n", () => {
  const r = pickNext(state({ explore: { rate: 0.1, rng: seq(0.5) } }));
  assert.equal(slugOf(r), "a1"); assert.equal(r.explored, false);
  assert.equal(r.propensity, 0.933);
  assert.doesNotMatch(r.reason, /variety/i);
});
test("exploring and drawing the top choice again is not called a variety pick", () => {
  const r = pickNext(state({ explore: { rate: 1, rng: seq(0, 0) } })); // explore, index 0 = a1 = the top choice
  assert.equal(slugOf(r), "a1"); assert.equal(r.explored, false); assert.equal(r.propensity, 0.333);
});
test("the propensities of all fitting problems add up to 1", () => {
  const rate = 0.25, fits = 3;
  const total = (1 - rate + rate / fits) + (fits - 1) * (rate / fits);
  assert.ok(Math.abs(total - 1) < 1e-12);
});
test("a single fitting problem has propensity 1 even with variety on", () => {
  const only = state({ problems: problems.filter((p) => p.slug === "a1" || p.slug === "a3"), explore: { rate: 0.9, rng: seq(0) } });
  const r = pickNext(only);
  assert.equal(slugOf(r), "a1"); assert.equal(r.propensity, 1); assert.equal(r.explored, false);
});
test("the closest-fallback pick is never random, logs its candidates and has propensity 1", () => {
  const r = pickNext(state({ ratings: new Map([["A", 2000], ["F", 2000]]), explore: { rate: 1, rng: seq(0) } }));
  assert.equal(r.mode, "closest"); assert.equal(r.explored, false); assert.equal(r.propensity, 1);
  assert.equal(r.fitsCount, 0); assert.ok(r.candidates.length >= 3);
  assert.equal(r.candidates[0].slug, slugOf(r));
});
test("at most 12 candidates are listed", () => {
  const many = Array.from({ length: 30 }, (_, i) => P(`m${String(i).padStart(2, "0")}`, "A", "easy", 900));
  assert.equal(pickNext(state({ problems: many })).candidates.length, 12);
});

console.log(failures === 0 ? "\nAll picker tests passed." : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
