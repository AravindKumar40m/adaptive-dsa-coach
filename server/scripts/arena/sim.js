// Simulator v2: learners with TRUE hidden skills who practise on our REAL 120 problems, chosen by our REAL picker.
// It is NOT evidence about real people. It has two honest jobs:
//   1. check the model code is correct, and
//   2. check each idea (uncertainty, multi-skill, forgetting, transfer) HELPS when its effect really exists in the data
//      and does NOT HURT when it does not: that is what the different "worlds" are for.
// Each world switches behaviours on or off. Everything is seeded, so a run can be repeated exactly.
import { readFileSync } from "node:fs";
import { pickNext } from "../../src/recommend/picker.js";
import { DAY_MS, SCALE, sigmoid } from "../../src/kt/index.js";

const content = JSON.parse(readFileSync(new URL("../../content/build/content.json", import.meta.url), "utf8"));
export const PROBLEMS = content.problems.map((p) => ({ slug: p.slug, title: p.title, concept: p.concept, difficulty: p.difficulty, rating: p.rating, skills: p.skills }));
export const CONCEPTS = content.concepts;

/** What each world switches on. learning = true skill gained per attempt; halfLife = days for true skill to fade halfway to the floor. */
export const WORLDS = {
  "W0-static": { learning: 0, halfLife: Infinity, multiTruth: false, correlated: false, itemSd: 60, sessionSd: 0, tagCorruption: 0 },
  "W1-learning": { learning: 12, halfLife: Infinity, multiTruth: false, correlated: false, itemSd: 60, sessionSd: 0, tagCorruption: 0 },
  "W2-multiskill": { learning: 12, halfLife: Infinity, multiTruth: true, correlated: false, itemSd: 60, sessionSd: 0, tagCorruption: 0 },
  // a deliberately STRONG forgetting effect (learners come back every ~8 days, skills halve in 12): a power check, so a working model cannot miss it
  "W3-forgetting": { learning: 12, halfLife: 12, gapDays: 8, multiTruth: false, correlated: false, itemSd: 60, sessionSd: 0, tagCorruption: 0 },
  "W4-realistic": { learning: 12, halfLife: 25, multiTruth: true, correlated: true, itemSd: 120, sessionSd: 40, tagCorruption: 0.3 },
};
export const GUESS = 0.08, SLIP = 0.05, FLOOR = 850, MAX_ATTEMPTS = 60;

// ---- seeded randomness
export function rng(seed) {
  let a = seed >>> 0;
  const next = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  next.normal = (mean = 0, sd = 1) => mean + sd * Math.sqrt(-2 * Math.log(1 - next())) * Math.cos(2 * Math.PI * next());
  next.exp = (mean) => -mean * Math.log(1 - next());
  next.poisson = (lambda) => { let k = 0, p = 1; const L = Math.exp(-lambda); do { k++; p *= next(); } while (p > L); return k - 1; };
  return next;
}

/** What the MODELS are told about each problem's skills: the truth, with some secondary skills replaced by wrong ones. */
export function taggedProblems(world, rand) {
  return PROBLEMS.map((p) => {
    if (p.skills.length < 2 || rand() >= world.tagCorruption) return p;
    const others = CONCEPTS.map((c) => c.key).filter((k) => !p.skills.some((s) => s.concept === k));
    return { ...p, skills: p.skills.map((s, i) => (i === 0 ? s : { ...s, concept: others[Math.floor(rand() * others.length)] })) };
  });
}

/** @returns {{ sequences, catalogProblems }}  sequences: [{ learner, events: [{ slug, t, y }] }] */
export function simulate(worldName, { learners = 400, seed = 1 } = {}) {
  const world = WORLDS[worldName];
  if (!world) throw new Error(`unknown world ${worldName}`);
  const rand = rng(seed * 7919 + 13);
  const trueDifficulty = new Map(PROBLEMS.map((p) => [p.slug, p.rating + rand.normal(0, world.itemSd)]));
  const seen = taggedProblems(world, rand);
  const concepts = CONCEPTS.map((c) => ({ key: c.key, name: c.name, prerequisites: c.prerequisites }));
  const sequences = [];

  for (let n = 0; n < learners; n++) {
    // ---- who this learner really is
    const shared = world.correlated ? rand.normal(0, 120) : 0; //     overall ability (helps in every topic)
    const topicSd = world.correlated ? 80 : 150;
    const theta = new Map(concepts.map((c) => [c.key, 950 + shared + rand.normal(0, topicSd)]));
    const last = new Map(); //                                         concept -> last practised (ms)
    const speed = Math.exp(rand.normal(0, 0.3)); //                    how fast this learner improves
    // ---- what the picker believes (it only ever sees outcomes, like production)
    const ratings = new Map(), attempts = new Map(), solved = new Set(), attempted = new Set(); // attempted: the label is the FIRST Submit, so a problem is never offered twice
    let t = Math.floor(rand() * 60) * DAY_MS + Math.floor(rand() * 12 * 3600e3);
    const events = [];
    let sessions = 0, done = false;

    while (!done && events.length < MAX_ATTEMPTS) {
      sessions++;
      const sessionEffect = world.sessionSd ? rand.normal(0, world.sessionSd) : 0;
      const size = 3 + rand.poisson(2);
      for (let k = 0; k < size && events.length < MAX_ATTEMPTS; k++) {
        const pick = pickNext({ concepts, problems: seen, difficulty: new Map(), ratings, solved, exclude: attempted, explore: { rate: 0.1, rng: rand } });
        if (pick.done || pick.repeated) { done = true; break; } // nothing fresh left to offer
        const problem = PROBLEMS.find((p) => p.slug === pick.problem.slug);
        const truth = world.multiTruth ? problem.skills : [{ concept: problem.concept, weight: 1 }];

        // forgetting of the TRUE skills, then the outcome
        let skill = 0;
        for (const { concept, weight } of truth) {
          if (Number.isFinite(world.halfLife) && last.has(concept)) {
            const keep = 2 ** (-((t - last.get(concept)) / DAY_MS) / world.halfLife);
            theta.set(concept, FLOOR + (theta.get(concept) - FLOOR) * keep);
          }
          skill += weight * theta.get(concept);
        }
        const pTrue = GUESS + (1 - GUESS - SLIP) * sigmoid((skill + sessionEffect - trueDifficulty.get(problem.slug)) / SCALE);
        const y = rand() < pTrue ? 1 : 0;
        events.push({ slug: problem.slug, t, y, pTrue: Math.round(pTrue * 1e5) / 1e5 }); // pTrue: what a model that knew the true skill would say (for the ceiling)

        // true learning from practice (failures teach a bit more)
        for (const { concept, weight } of truth) {
          theta.set(concept, theta.get(concept) + speed * world.learning * weight * (1 + 0.5 * (1 - y)));
          last.set(concept, t);
        }
        // the picker's own bookkeeping (production Elo, binary outcome)
        const c = problem.concept, r = ratings.get(c) ?? 1000, a = attempts.get(c) ?? 0;
        ratings.set(c, r + (a < 10 ? 40 : 16) * (y - 1 / (1 + 10 ** ((problem.rating - r) / 400))));
        attempts.set(c, a + 1);
        attempted.add(problem.slug);
        if (y) solved.add(problem.slug);
        t += Math.floor((5 + rand() * 20) * 60e3);
      }
      // the next visit; some learners drift away
      if (sessions >= 3 && rand() < 0.06) break;
      t += Math.floor((0.5 + rand.exp(world.gapDays ?? 3)) * DAY_MS);
    }
    if (events.length >= 2) sequences.push({ learner: `${worldName}-${seed}-${n}`, events });
  }
  return { sequences, catalogProblems: seen };
}
