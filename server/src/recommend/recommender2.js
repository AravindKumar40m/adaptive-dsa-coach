// Recommender v2 (pure functions: no database). Picks the next problem by scoring every candidate on several things at once,
// using the knowledge model's picture of the learner (see kt/models.js `describe`):
//   fit      is the chance of solving it close to what we are aiming for? (the aim follows the session arc and recent results)
//   info     how much would it teach US about the learner (uncertainty removed)?
//   weak     is it in a skill below the learner's own average?
//   review   has the skill faded since it was last practised?
//   variety  not the same topic over and over
// The pick is drawn with softmax weights, so every candidate has a known probability ("propensity") that is logged.
// The curriculum rules of v1 stay: a topic opens only after its prerequisites were solved (picker.js conceptStatus).
import { conceptStatus } from "./picker.js";

export const WEIGHTS = { fit: 1.0, info: 0.6, weak: 0.4, review: 0.5, variety: 0.35 };
export const TAU = 0.15; //             softmax temperature: lower = closer to "always the best score"
export const WARMUP_ATTEMPTS = 6; //    the first problems lean towards learning who the learner is (a gentle placement)
export const INFO_SCALE = 0.08; //      an observation that removes 8% of the starting uncertainty counts as "fully informative"
export const SLOT_TARGET = { warmup: 0.8, core: 0.65, stretch: 0.5 }; // aimed chance of success per point in a session
export const MIN_P = 0.2, MAX_P = 0.95; // never offer something hopeless or trivial (unless nothing else is left)
export const MAX_CANDIDATES = 12;

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

/** The session arc: a warm-up, then core problems, then a stretch. attemptsInSession counts problems already attempted this session. */
export const slotFor = (attemptsInSession) => (attemptsInSession <= 0 ? "warmup" : attemptsInSession === 3 ? "stretch" : "core");

/** The chance of success we aim for: the slot's value, made easier after two failures in a row and harder after three wins in a row. */
export function targetFor(slot, recent = []) {
  let target = SLOT_TARGET[slot] ?? SLOT_TARGET.core;
  const last = recent.slice(-3).map((r) => r.y);
  if (last.length >= 2 && last.slice(-2).every((y) => y === 0)) target += 0.1;
  if (last.length === 3 && last.every((y) => y === 1)) target -= 0.05;
  return clamp(target, 0.4, 0.9);
}

export const fitScore = (p, target) => Math.exp(-0.5 * ((p - target) / 0.15) ** 2);

/** @returns {{ score, parts }}  parts are the five numbers (0..1) before weighting */
export function scoreCandidate({ d, concept, target, recent = [], weights = WEIGHTS, warmup = false }) {
  const lastConcepts = recent.slice(-3).map((r) => r.concept);
  const parts = {
    fit: fitScore(d.p, target),
    info: clamp(d.info / INFO_SCALE, 0, 1),
    weak: (clamp(d.weakness, -1, 1) + 1) / 2,
    review: clamp(d.review / 100, 0, 1),
    variety: lastConcepts.length ? lastConcepts.filter((c) => c === concept).length / lastConcepts.length : 0, // 1 = the same topic every time lately
  };
  const wInfo = weights.info * (warmup ? 2 : 1);
  const score = weights.fit * parts.fit + wInfo * parts.info + weights.weak * parts.weak + weights.review * parts.review - weights.variety * parts.variety;
  return { score, parts };
}

function softmax(scores, tau) {
  const top = Math.max(...scores);
  const e = scores.map((s) => Math.exp((s - top) / tau));
  const sum = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / sum);
}

function reasonFor({ slot, parts, p, conceptName, warmup, target }) {
  const pct = `about ${Math.round(p * 100)}% chance to solve it`;
  if (parts.review >= 0.5) return `It has been a while since you practised ${conceptName}, so this is a refresher (${pct}).`;
  if (warmup && parts.info >= 0.6) return `This helps us learn where you are in ${conceptName}, and it should be a fair challenge (${pct}).`;
  if (slot === "warmup") return `A warm-up to start the session: ${conceptName}, ${pct}.`;
  if (slot === "stretch") return `A stretch problem to finish: ${conceptName}, a little harder than usual (${pct}).`;
  if (parts.weak >= 0.75) return `${conceptName} is below your usual level, so it is worth practising (${pct}).`;
  return `A good next challenge in ${conceptName} (${pct}).`;
}

/**
 * @param {{concepts, problems:{slug,title,concept,difficulty,rating}[], solved:Set, exclude?:Set, model, L, now:number,
 *          slot?:string, weights?:object, tau?:number, deterministic?:boolean, rng?:()=>number}} s   model = a Kalman model, L its learner state
 * @returns {{done:true, reason}|{done:false, problem, p, slot, target, score, parts, propensity, explored, greedySlug, candidates, repeated, poolSize, openCount, reason}}
 */
export function pickNextV2({ concepts, problems, solved, placed = new Set(), exclude = new Set(), model, L, now, slot = "core", weights = WEIGHTS, tau = TAU, deterministic = false, rng = Math.random }) {
  const status = conceptStatus({ concepts, problems, solved, placed });
  const names = new Map(concepts.map((c) => [c.key, c.name]));
  const open = problems.filter((p) => !solved.has(p.slug) && status.get(p.concept).unlocked);
  if (open.length === 0) return { done: true, reason: "You have solved every available problem. More are coming." };

  let pool = open.filter((p) => !exclude.has(p.slug)), repeated = false;
  if (pool.length === 0) { pool = open; repeated = true; }

  const target = targetFor(slot, L.recent);
  const warmup = (L.attempts ?? 0) < WARMUP_ATTEMPTS;
  let rows = pool.map((problem) => {
    const d = model.describe(L, { slug: problem.slug, t: now });
    return { problem, d, ...scoreCandidate({ d, concept: problem.concept, target, recent: L.recent, weights, warmup }) };
  });
  const viable = rows.filter((r) => r.d.p >= MIN_P && r.d.p <= MAX_P);
  if (viable.length > 0) rows = viable;
  rows.sort((a, b) => b.score - a.score || a.problem.slug.localeCompare(b.problem.slug));

  const probs = softmax(rows.map((r) => r.score), tau);
  let pickIndex = 0;
  if (!deterministic) {
    let x = rng(), acc = 0;
    pickIndex = rows.length - 1;
    for (let i = 0; i < probs.length; i++) { acc += probs[i]; if (x < acc) { pickIndex = i; break; } }
  }
  const chosen = rows[pickIndex];
  const round = (x, k = 3) => Math.round(x * 10 ** k) / 10 ** k;
  return {
    done: false, problem: chosen.problem, p: chosen.d.p, slot, target, score: round(chosen.score), parts: Object.fromEntries(Object.entries(chosen.parts).map(([k, v]) => [k, round(v)])),
    propensity: deterministic ? 1 : round(probs[pickIndex], 4), explored: pickIndex !== 0, greedySlug: rows[0].problem.slug, repeated,
    candidates: rows.slice(0, MAX_CANDIDATES).map((r, i) => ({ slug: r.problem.slug, concept: r.problem.concept, expectedSuccess: round(r.d.p), score: round(r.score), greedyRank: i + 1, parts: Object.fromEntries(Object.entries(r.parts).map(([k, v]) => [k, round(v, 2)])) })),
    poolSize: pool.length, openCount: open.length, warmup,
    reason: reasonFor({ slot, parts: chosen.parts, p: chosen.d.p, conceptName: names.get(chosen.problem.concept), warmup, target }),
  };
}
