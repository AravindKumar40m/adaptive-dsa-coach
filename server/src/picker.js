// Next-problem picker (MVP, no model training). Pure functions: no database, easy to test.
//
// 1. Unlocking: a concept is "solid" once the learner solved min(2, number of problems in it) of its problems.
//    Concepts with no problems yet count as solid, so they never block anything. A concept is unlocked when
//    every prerequisite is solid. (We do not use the rating for unlocking: everyone starts at 1000, so a rating
//    rule would unlock everything on day one.)
// 2. Choosing: among unlocked, unsolved problems whose expected success is near the target (0.65, window 0.5-0.8),
//    take the WEAKEST concept (lowest rating), then the problem closest to the target in it.
//    If nothing is in the window, take the closest problem anywhere.
// 3. The learner can skip problems (exclude); solved problems are never offered again.
import { START_RATING, expectedScore } from "./skill.js";

export const TARGET_SUCCESS = 0.65; // CLAUDE.md: expected success about 0.6 to 0.7
export const WINDOW = 0.15; // a problem "fits" when its expected success is within target +/- window
export const UNLOCK_SOLVED = 2;

/** For each concept: how many problems, how many solved, is it solid, is it unlocked, and which prerequisites block it. */
export function conceptStatus({ concepts, problems, solved }) {
  const total = new Map();
  const done = new Map();
  for (const p of problems) {
    total.set(p.concept, (total.get(p.concept) ?? 0) + 1);
    if (solved.has(p.slug)) done.set(p.concept, (done.get(p.concept) ?? 0) + 1);
  }
  const solid = (key) => (total.get(key) ?? 0) === 0 || (done.get(key) ?? 0) >= Math.min(UNLOCK_SOLVED, total.get(key));
  const status = new Map();
  for (const c of concepts) {
    const missing = c.prerequisites.filter((pre) => !solid(pre));
    status.set(c.key, {
      total: total.get(c.key) ?? 0,
      solved: done.get(c.key) ?? 0,
      solid: solid(c.key),
      unlocked: missing.length === 0,
      missing,
    });
  }
  return status;
}

const pct = (x) => Math.round(x * 100);

/**
 * @param {{concepts, problems, difficulty:Map, ratings:Map, solved:Set, exclude:Set}} state
 *   problems: [{slug, title, concept, difficulty, rating}]  difficulty: slug -> current Elo difficulty  ratings: concept -> rating
 * @returns {{done:true, ...} | {done:false, problem, expectedSuccess, mode, reason, repeated}}
 */
export function pickNext({ concepts, problems, difficulty, ratings, solved, exclude = new Set() }) {
  const status = conceptStatus({ concepts, problems, solved });
  const order = new Map(concepts.map((c, i) => [c.key, i]));
  const name = new Map(concepts.map((c) => [c.key, c.name]));
  const ratingOf = (concept) => ratings.get(concept) ?? START_RATING;
  const expected = (p) => expectedScore(ratingOf(p.concept), difficulty.get(p.slug) ?? p.rating);

  const open = problems.filter((p) => !solved.has(p.slug) && status.get(p.concept).unlocked);
  if (open.length === 0) return { done: true, reason: "You have solved every available problem. More are coming." };

  let repeated = false;
  let pool = open.filter((p) => !exclude.has(p.slug));
  if (pool.length === 0) { pool = open; repeated = true; } // the learner skipped everything that is left

  const distance = (p) => Math.abs(expected(p) - TARGET_SUCCESS);
  const byFit = (a, b) => distance(a) - distance(b) || (difficulty.get(a.slug) ?? a.rating) - (difficulty.get(b.slug) ?? b.rating) || a.slug.localeCompare(b.slug);

  const fits = pool.filter((p) => distance(p) <= WINDOW);
  if (fits.length > 0) {
    const concept = [...new Set(fits.map((p) => p.concept))].sort((a, b) => ratingOf(a) - ratingOf(b) || order.get(a) - order.get(b))[0];
    const problem = fits.filter((p) => p.concept === concept).sort(byFit)[0];
    const e = expected(problem);
    return {
      done: false, problem, expectedSuccess: e, mode: "weakest", repeated,
      reason: `${name.get(concept)} is your weakest open topic (rating ${Math.round(ratingOf(concept))}), and this problem should be a good challenge: about ${pct(e)}% chance to solve it.`,
    };
  }
  const problem = [...pool].sort((a, b) => byFit(a, b) || ratingOf(a.concept) - ratingOf(b.concept))[0];
  const e = expected(problem);
  return {
    done: false, problem, expectedSuccess: e, mode: "closest", repeated,
    reason: `No open problem is a perfect fit right now, so this is the closest one (${name.get(problem.concept)}, about ${pct(e)}% chance to solve it).`,
  };
}
