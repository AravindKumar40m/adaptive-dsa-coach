// Unit tests for the recommender v2 pieces (kt describe, scoring, session arc, softmax pick). Expected numbers were worked out
// separately in Python. No database. Run: npm run test:recommender2
import assert from "node:assert/strict";
import { DAY_MS, buildCatalog, createModel } from "../../src/kt/index.js";
import { WEIGHTS, WARMUP_ATTEMPTS, fitScore, pickNextV2, scoreCandidate, slotFor, targetFor } from "../../src/recommend/recommender2.js";

let failures = 0;
const test = (name, fn) => {
  try { fn(); console.log("ok  ", name); } catch (e) { failures++; console.log("FAIL", name, "\n     ", e.message); }
};
const near = (a, b, tol, label = "") => assert.ok(Math.abs(a - b) <= tol, `${label} expected ${b}, got ${a}`);

// A (no prerequisites) -> B ; C (no prerequisites)
const concepts = [
  { key: "A", name: "Alpha", prerequisites: [] },
  { key: "B", name: "Beta", prerequisites: ["A"] },
  { key: "C", name: "Gamma", prerequisites: [] },
];
const P = (slug, concept, rating) => ({ slug, title: slug, concept, difficulty: "easy", rating });
const problems = [P("a0", "A", 700), P("a1", "A", 900), P("a2", "A", 1100), P("c1", "C", 1000), P("c2", "C", 1300), P("b1", "B", 1000), P("hopeless", "C", 2600)];
const catalog = buildCatalog(problems);
const model = createModel("kt-full", { sd0: 100, drift: 12, halfLifeDays: 30, transfer: 0.5 }, catalog);
const faded = () => { // skill A was 1400 and sits unpractised for 30 days (one half-life)
  const L = model.newLearner();
  L.skills.set("A", { theta: 1400, v: 10000, n: 5, last: 0 });
  L.attempts = 5;
  return L;
};
const T30 = 30 * DAY_MS;

// ---------------------------------------------------------------- what the model can say about a candidate
test("describe: chance, information, fading and weakness for a skill that faded (worked by hand)", () => {
  const d = model.describe(faded(), { slug: "a1", t: T30 });
  near(d.p, 0.8354114, 1e-6, "p"); near(d.pPlug, 0.8490204, 1e-6, "plain p");
  near(d.info, 0.0419030, 1e-6, "info"); near(d.review, 200, 1e-9, "faded points"); near(d.weakness, 1, 1e-9, "weakness"); near(d.level, 1400, 1e-9, "level");
});
test("describe: a NEW skill starts from the learner's overall level (transfer) and teaches us more", () => {
  const d = model.describe(faded(), { slug: "c1", t: T30 });
  near(d.pPlug, 0.7597469, 1e-6); near(d.info, 0.0586417, 1e-6);
  assert.equal(d.review, 0, "nothing to refresh in a skill never practised");
  assert.ok(d.info > model.describe(faded(), { slug: "a1", t: T30 }).info, "more uncertain skill = more information");
});
test("describe never changes the learner", () => {
  const L = faded(), before = JSON.stringify([[...L.skills], L.attempts, L.recent]);
  model.describe(L, { slug: "a1", t: T30 }); model.describe(L, { slug: "c1", t: 2 * T30 });
  assert.equal(JSON.stringify([[...L.skills], L.attempts, L.recent]), before);
});
test("update keeps the last 5 outcomes", () => {
  const L = model.newLearner();
  for (let i = 0; i < 7; i++) model.update(L, { slug: i % 2 ? "a1" : "c1", t: i * 1000 }, i % 3 === 0 ? 1 : 0);
  assert.equal(L.recent.length, 5);
  assert.deepEqual(L.recent.map((r) => r.y), [0, 1, 0, 0, 1].map((_, i) => [2, 3, 4, 5, 6][i] % 3 === 0 ? 1 : 0));
  assert.deepEqual(L.recent.map((r) => r.concept), [2, 3, 4, 5, 6].map((i) => (i % 2 ? "A" : "C")));
});

// ---------------------------------------------------------------- the aim
test("session arc: warm-up, two core problems, a stretch, then core again", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(slotFor), ["warmup", "core", "core", "stretch", "core", "core"]);
});
test("the aimed success rate follows the slot and the recent results", () => {
  near(targetFor("warmup"), 0.8, 1e-12); near(targetFor("core"), 0.65, 1e-12); near(targetFor("stretch"), 0.5, 1e-12);
  const f = (y) => ({ y, concept: "A" });
  near(targetFor("core", [f(1), f(0), f(0)]), 0.75, 1e-12, "two failures in a row: easier");
  near(targetFor("core", [f(0), f(1), f(1), f(1)]), 0.6, 1e-12, "three wins in a row: a little harder");
  near(targetFor("core", [f(0), f(1)]), 0.65, 1e-12, "mixed: unchanged");
  near(targetFor("warmup", [f(0), f(0)]), 0.9, 1e-12, "capped at 0.9");
  near(targetFor("stretch", [f(1), f(1), f(1)]), 0.45, 1e-12);
});
test("fit is 1 on target and 0.607 one 'width' (0.15) away on either side", () => {
  near(fitScore(0.65, 0.65), 1, 1e-12); near(fitScore(0.8, 0.65), 0.6065307, 1e-6); near(fitScore(0.5, 0.65), 0.6065307, 1e-6);
});

// ---------------------------------------------------------------- scoring
const d0 = { p: 0.65, info: 0.04, weakness: 0, review: 50 }; // a neutral candidate
test("score = weighted sum of fit, information, weakness, review, minus variety", () => {
  const { score, parts } = scoreCandidate({ d: d0, concept: "A", target: 0.65, recent: [] });
  near(parts.fit, 1, 1e-12); near(parts.info, 0.5, 1e-12); near(parts.weak, 0.5, 1e-12); near(parts.review, 0.5, 1e-12); assert.equal(parts.variety, 0);
  near(score, 1.0 * 1 + 0.6 * 0.5 + 0.4 * 0.5 + 0.5 * 0.5, 1e-12);
});
test("repeating the same topic costs points (all 3 recent attempts in it: -0.35)", () => {
  const rec = (c) => ({ y: 1, concept: c });
  const same = scoreCandidate({ d: d0, concept: "A", target: 0.65, recent: [rec("A"), rec("A"), rec("A")] });
  const other = scoreCandidate({ d: d0, concept: "C", target: 0.65, recent: [rec("A"), rec("A"), rec("A")] });
  near(other.score - same.score, WEIGHTS.variety, 1e-12);
  const one = scoreCandidate({ d: d0, concept: "A", target: 0.65, recent: [rec("A"), rec("C"), rec("C")] });
  near(one.parts.variety, 1 / 3, 1e-12);
});
test("during the first attempts information counts double (a gentle placement)", () => {
  const cold = scoreCandidate({ d: d0, concept: "A", target: 0.65, warmup: true }).score;
  const warm = scoreCandidate({ d: d0, concept: "A", target: 0.65, warmup: false }).score;
  near(cold - warm, WEIGHTS.info * 0.5, 1e-12);
});
test("a closer fit beats a farther one when everything else is equal", () => {
  const a = scoreCandidate({ d: { ...d0, p: 0.66 }, concept: "A", target: 0.65 }).score;
  const b = scoreCandidate({ d: { ...d0, p: 0.9 }, concept: "A", target: 0.65 }).score;
  assert.ok(a > b);
});

// ---------------------------------------------------------------- the pick
const base = (extra = {}) => ({ concepts, problems, solved: new Set(), exclude: new Set(), model, L: model.newLearner(), now: 0, slot: "core", deterministic: true, ...extra });
test("curriculum rules still apply: B stays locked until 2 problems of A are solved", () => {
  const r = pickNextV2(base());
  assert.notEqual(r.problem.concept, "B");
  const open = pickNextV2(base({ solved: new Set(["a1", "a2"]), weights: { fit: 0, info: 0, weak: 0, review: 0, variety: 0 } }));
  assert.ok(open.candidates.some((c) => c.slug === "b1"), "b1 is a candidate after A is solid");
});
test("solved and skipped problems are never offered; skipping everything flags a repeat; solving everything is 'done'", () => {
  const r = pickNextV2(base({ solved: new Set(["a1"]), exclude: new Set(["c1"]) }));
  assert.ok(!r.candidates.some((c) => c.slug === "a1" || c.slug === "c1"));
  const all = pickNextV2(base({ exclude: new Set(["a0", "a1", "a2", "c1", "c2", "hopeless"]) }));
  assert.equal(all.repeated, true); assert.equal(all.done, false);
  assert.equal(pickNextV2(base({ solved: new Set(problems.map((p) => p.slug)) })).done, true);
});
test("a hopeless problem (a 2% chance) is never offered while others are fine", () => {
  const r = pickNextV2(base());
  assert.ok(!r.candidates.some((c) => c.slug === "hopeless"));
  assert.ok(r.candidates.every((c) => c.expectedSuccess >= 0.2 && c.expectedSuccess <= 0.95));
});
test("candidates are listed best-first with their scores and the five parts", () => {
  const r = pickNextV2(base());
  assert.equal(r.candidates[0].slug, r.greedySlug); assert.equal(r.candidates[0].greedyRank, 1);
  for (let i = 1; i < r.candidates.length; i++) assert.ok(r.candidates[i - 1].score >= r.candidates[i].score);
  assert.deepEqual(Object.keys(r.candidates[0].parts).sort(), ["fit", "info", "review", "variety", "weak"]);
});
test("deterministic mode always takes the top score and says propensity 1", () => {
  const r = pickNextV2(base());
  assert.equal(r.problem.slug, r.greedySlug); assert.equal(r.propensity, 1); assert.equal(r.explored, false);
});
test("sampling: the chance of each pick is its softmax weight (and weights add to 1)", () => {
  const rows = pickNextV2(base({ deterministic: false, rng: () => 0 })).candidates;
  assert.ok(rows.length >= 3, "fixture has several candidates");
  const tau = 0.15, top = Math.max(...rows.map((r) => r.score));
  const e = rows.map((r) => Math.exp((r.score - top) / tau)), sum = e.reduce((a, b) => a + b, 0);
  const first = pickNextV2(base({ deterministic: false, rng: () => 0 }));
  near(first.propensity, e[0] / sum, 2e-3, "top propensity"); assert.equal(first.explored, false);
  const last = pickNextV2(base({ deterministic: false, rng: () => 0.9999999 }));
  assert.equal(last.problem.slug, rows.at(-1).slug); assert.equal(last.explored, true);
  near(last.propensity, e.at(-1) / sum, 2e-3, "last propensity");
  near(e.reduce((a, b) => a + b / sum, 0), 1, 1e-12);
});
test("a skill that faded is refreshed when review is what counts", () => {
  const L = faded();
  L.skills.set("C", { theta: 1000, v: 4000, n: 5, last: T30 }); // C was practised just now; A faded
  const r = pickNextV2(base({ L, now: T30, weights: { fit: 0.01, info: 0, weak: 0, review: 1, variety: 0 } }));
  assert.equal(r.problem.concept, "A", "a problem in the faded skill A comes first");
  assert.match(r.reason, /refresher|while/);
});
test("a learner who just failed twice is aimed at an easier problem", () => {
  const f = { y: 0, concept: "A" };
  const normal = pickNextV2(base({ weights: { fit: 1, info: 0, weak: 0, review: 0, variety: 0 } }));
  const L = model.newLearner(); L.recent = [f, f];
  const eased = pickNextV2(base({ L, weights: { fit: 1, info: 0, weak: 0, review: 0, variety: 0 } }));
  assert.ok(eased.p > normal.p, `${eased.p} should exceed ${normal.p}`);
  near(eased.target, 0.75, 1e-12);
});
test("every pick comes with a plain-words reason that names the topic", () => {
  const r = pickNextV2(base({ slot: "stretch" }));
  assert.match(r.reason, /Alpha|Gamma/); assert.match(r.reason, /\d+%/);
  assert.match(pickNextV2(base({ slot: "warmup" })).reason, /warm-up|helps us learn/i);
});
test("the warm-up phase ends after the first attempts", () => {
  assert.equal(pickNextV2(base()).warmup, true);
  const L = model.newLearner(); L.attempts = WARMUP_ATTEMPTS;
  assert.equal(pickNextV2(base({ L })).warmup, false);
});

console.log(failures === 0 ? "\nAll recommender-v2 tests passed." : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
