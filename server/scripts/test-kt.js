// Unit tests for the knowledge models and the scoring metrics. Expected numbers were worked out separately by hand/Python
// (not by running this code). No database. Run: npm run test:kt
import assert from "node:assert/strict";
import { DAY_MS, buildCatalog, createModel, evaluate } from "../src/kt/index.js";
import { accuracy, auc, brier, ece, logLoss, pairedDifference } from "../src/kt/metrics.js";

let failures = 0;
const test = (name, fn) => {
  try { fn(); console.log("ok  ", name); } catch (e) { failures++; console.log("FAIL", name, "\n     ", e.message); }
};
const near = (a, b, tol, label = "") => assert.ok(Math.abs(a - b) <= tol, `${label} expected ${b}, got ${a}`);

// a tiny catalog: A1 (seed 900, skill A), A2 (seed 1100, skill A), B1 (seed 1000, skill B), AB (seed 1100: 70% A + 30% B)
const catalog = buildCatalog([
  { slug: "a1", concept: "A", rating: 900 },
  { slug: "a2", concept: "A", rating: 1100 },
  { slug: "b1", concept: "B", rating: 1000 },
  { slug: "ab", concept: "A", rating: 1100, skills: [{ concept: "A", weight: 0.7 }, { concept: "B", weight: 0.3 }] },
]);
const model = (kind, params = {}) => createModel(kind, params, catalog);
const ev = (slug, t = 0) => ({ slug, t });

// ---------------------------------------------------------------- the production rule
test("elo: the same step as production (E = 0.640, then +14.397 for a win, K = 40)", () => {
  const m = model("elo"), L = m.newLearner();
  near(m.predict(L, ev("a1")), 0.6400650, 1e-6, "E");
  m.update(L, ev("a1"), 1);
  near(L.skills.get("A").theta, 1014.3974, 1e-3);
});
test("elo: K drops to 16 after 10 attempts on the concept", () => {
  const m = model("elo"), L = m.newLearner();
  L.skills.set("A", { theta: 1000, n: 10 });
  m.update(L, ev("a1"), 1);
  near(L.skills.get("A").theta, 1005.75896, 1e-4);
});

// ---------------------------------------------------------------- uncertainty
test("kt-unc: a brand-new skill is predicted closer to 50% than Elo says (0.605 instead of 0.640)", () => {
  const m = model("kt-unc", { drift: 0 }), L = m.newLearner();
  near(m.predict(L, ev("a1")), 0.6052729, 1e-6);
});
test("kt-unc: the first result moves the rating a lot (+87.7 for a win, -155.9 for a loss) and halves-ish the uncertainty", () => {
  const win = model("kt-unc", { drift: 0 }), Lw = win.newLearner();
  win.update(Lw, ev("a1"), 1);
  near(Lw.skills.get("A").theta, 1087.668, 2e-3); near(Lw.skills.get("A").v, 42311.7, 0.5);
  const loss = model("kt-unc", { drift: 0 }), Ll = loss.newLearner();
  loss.update(Ll, ev("a1"), 0);
  near(Ll.skills.get("A").theta, 844.102, 2e-3);
});
test("kt-unc: process noise (drift 12) makes the step slightly larger", () => {
  const m = model("kt-unc", { drift: 12 }), L = m.newLearner();
  m.update(L, ev("a1"), 1);
  near(L.skills.get("A").theta, 1087.804, 2e-3);
});
test("kt-unc: steps shrink as evidence accumulates (the 20th identical win moves the rating far less than the 1st)", () => {
  const m = model("kt-unc"), L = m.newLearner();
  m.update(L, ev("a1"), 1);
  const first = L.skills.get("A").theta - 1000;
  for (let i = 0; i < 18; i++) m.update(L, ev("a1"), 1);
  const before = L.skills.get("A").theta;
  m.update(L, ev("a1"), 1);
  assert.ok(L.skills.get("A").theta - before < first / 8, `${L.skills.get("A").theta - before} vs first ${first}`);
  assert.ok(L.skills.get("A").v < 62500 / 4, "the uncertainty fell");
});

// ---------------------------------------------------------------- multi-skill
test("kt-unc ignores the extra skills; kt-multi updates every skill a problem needs, by its weight", () => {
  const single = model("kt-unc", { drift: 0 }), Ls = single.newLearner();
  single.update(Ls, ev("ab"), 1);
  assert.deepEqual([...Ls.skills.keys()], ["A"], "only the main concept");
  const m = model("kt-multi", { drift: 0 }), L = m.newLearner();
  L.skills.set("A", { theta: 1200, v: 10000, n: 3, last: 0 });
  near(m.predict(L, ev("ab")), 0.5537774, 1e-6, "blended prediction");
  m.update(L, ev("ab"), 1);
  near(L.skills.get("A").theta, 1217.1512, 2e-3); near(L.skills.get("A").v, 9614.84, 0.05);
  near(L.skills.get("B").theta, 1045.6803, 2e-3); near(L.skills.get("B").v, 59752.21, 0.2);
});

// ---------------------------------------------------------------- forgetting
test("kt-forget: after one half-life a skill is half as far from 1000 and less certain (1400 -> 1200, v 10000 -> 36250)", () => {
  const m = model("kt-forget", { drift: 0, halfLifeDays: 30 });
  const L = m.newLearner();
  L.skills.set("A", { theta: 1400, v: 10000, n: 9, last: 0 });
  near(m.predict(L, ev("a2", 30 * DAY_MS)), 0.6164503, 1e-6);
  const view = m.view(L, "A", 30 * DAY_MS);
  near(view.theta, 1200, 1e-9); near(view.v, 36250, 1e-6);
  near(m.view(L, "A", 60 * DAY_MS).theta, 1100, 1e-9, "two half-lives");
});
test("kt-forget: with no forgetting the same skill keeps its rating (1400 -> p = 0.835)", () => {
  const m = model("kt-multi", { drift: 0, halfLifeDays: 30 }); // multi has forgetting switched off even if a half-life is given
  const L = m.newLearner();
  L.skills.set("A", { theta: 1400, v: 10000, n: 9, last: 0 });
  near(m.predict(L, ev("a2", 30 * DAY_MS)), 0.8354114, 1e-6);
});
test("kt-forget: prediction does not change the learner (no hidden side effects)", () => {
  const m = model("kt-full", { halfLifeDays: 10, transfer: 0.5 }), L = m.newLearner();
  m.update(L, ev("a1", 0), 1);
  const copy = JSON.stringify([...L.skills]);
  m.predict(L, ev("b1", 20 * DAY_MS)); m.predict(L, ev("ab", 40 * DAY_MS));
  assert.equal(JSON.stringify([...L.skills]), copy);
});

// ---------------------------------------------------------------- transfer and gain, guess and slip
test("kt-full: a NEW skill starts from the learner's overall level (transfer 0.5 on +200 = 1100)", () => {
  const m = model("kt-full", { drift: 0, transfer: 0.5 });
  const L = m.newLearner();
  L.skills.set("A", { theta: 1200, v: 10000, n: 5, last: 0 });
  near(m.predict(L, ev("b1")), 0.6052729, 1e-6);
  const without = model("kt-full", { drift: 0, transfer: 0 }), L2 = without.newLearner();
  L2.skills.set("A", { theta: 1200, v: 10000, n: 5, last: 0 });
  near(without.predict(L2, ev("b1")), 0.5, 1e-9);
});
test("practice gain adds points on every attempt, even when the outcome is a loss's neutral zero", () => {
  const m = model("kt-full", { drift: 0, gain: 5 }), L = m.newLearner();
  m.update(L, ev("a1"), 1);
  near(L.skills.get("A").theta, 1092.668, 2e-3);
});
test("guess and slip squeeze predictions into [guess, 1 - slip]", () => {
  const m = model("kt-unc", { drift: 0, guess: 0.1, slip: 0.05 }), L = m.newLearner();
  near(m.predict(L, ev("a1")), 0.1 + 0.85 * 0.6052729, 1e-6);
});

// ---------------------------------------------------------------- items and baselines
const seq = (learner, rows) => ({ learner, events: rows.map(([slug, y], i) => ({ slug, y, t: i * 1000 })) });
test("fit: a problem everybody fails becomes harder, one everybody solves becomes easier", () => {
  const train = Array.from({ length: 20 }, (_, i) => seq("L" + i, [["a2", 0], ["b1", 1]]));
  const m = model("kt-unc"); m.fit(train);
  assert.ok(m.offset.get("a2") > 20, `a2 offset ${m.offset.get("a2")}`);
  assert.ok(m.offset.get("b1") < -20, `b1 offset ${m.offset.get("b1")}`);
});
test("global-rate and item-mean", () => {
  const train = [seq("x", [["a1", 1], ["a1", 1], ["a1", 1], ["a1", 0]]), seq("y", [["b1", 0]])]; // 3 wins in 5 attempts
  const g = model("global-rate"); g.fit(train); near(g.predict(g.newLearner(), ev("a1")), 3 / 5, 1e-12);
  const it = model("item-mean"); it.fit(train);
  near(it.predict(it.newLearner(), ev("a1")), (3 + 5 * 0.6) / 9, 1e-12); // 3 wins in 4, shrunk towards 0.6 with weight 5
  near(it.predict(it.newLearner(), ev("a2")), 0.6, 1e-12, "an unseen problem falls back to the overall rate");
});
test("logreg learns that harder seed difficulty means fewer wins, and is deterministic", () => {
  let s = 7; const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const train = Array.from({ length: 60 }, (_, i) => seq("L" + i, Array.from({ length: 12 }, () => { const hard = rnd() < 0.5; return [hard ? "a2" : "a1", rnd() < (hard ? 0.3 : 0.8) ? 1 : 0]; })));
  const a = model("logreg"), b = model("logreg"); a.fit(train); b.fit(train);
  assert.deepEqual(a.w, b.w);
  const L = a.newLearner();
  assert.ok(a.predict(L, ev("a1")) > a.predict(L, ev("a2")) + 0.2, `${a.predict(L, ev("a1"))} vs ${a.predict(L, ev("a2"))}`);
});

// ---------------------------------------------------------------- the replay loop never peeks
test("evaluate: each attempt is predicted before its result is learned (no leakage from the future)", () => {
  const m = model("elo");
  const rows = evaluate(m, [seq("L", [["a1", 1], ["a1", 1], ["a1", 1]])]);
  near(rows[0].p, 0.6400650, 1e-6);
  assert.ok(rows[1].p > rows[0].p && rows[2].p > rows[1].p, "each win raises the next prediction");
  assert.deepEqual(rows.map((r) => r.i), [0, 1, 2]);
});

// ---------------------------------------------------------------- metrics
const R = (pairs) => pairs.map(([p, y], i) => ({ learner: "L", i, p, y }));
test("metrics, worked by hand", () => {
  const rows = R([[0.9, 1], [0.8, 1], [0.3, 0], [0.2, 0]]);
  near(logLoss(rows), 0.2270806, 1e-6); near(brier(rows), 0.045, 1e-12); assert.equal(accuracy(rows), 1); assert.equal(auc(rows), 1);
  near(ece(rows), 0.2, 1e-9);
  near(auc(R([[0.1, 0], [0.4, 0], [0.35, 1], [0.8, 1]])), 0.75, 1e-12);
  near(auc(R([[0.5, 1], [0.5, 0]])), 0.5, 1e-12, "a tie counts half");
  assert.ok(Number.isNaN(auc(R([[0.5, 1], [0.7, 1]]))), "undefined when only one class exists");
});
test("a perfect-confidence coin flip scores worse than 50/50 guessing (log-loss ln 2 = 0.693)", () => {
  near(logLoss(R([[0.5, 1], [0.5, 0]])), Math.LN2, 1e-12);
  assert.ok(logLoss(R([[0.99, 0], [0.01, 1]])) > 4);
});
test("paired difference: the better model wins by the right amount, with a standard error", () => {
  const mk = (p) => ["L1", "L2", "L3"].flatMap((learner) => [0, 1].map((i) => ({ learner, i, y: 1, p })));
  const d = pairedDifference(mk(0.9), mk(0.6));
  near(d.mean, 0.4054651, 1e-6); near(d.se, 0, 1e-12); assert.equal(d.learners, 3);
  const flipped = pairedDifference(mk(0.6), mk(0.9));
  near(flipped.mean, -0.4054651, 1e-6);
});

console.log(failures === 0 ? "\nAll knowledge-model tests passed." : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
