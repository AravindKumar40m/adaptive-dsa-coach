// Closed-loop simulator for RECOMMENDATION POLICIES. Unlike sim.js (which fixes the picker and scores prediction models),
// here the policy under test chooses every problem, and we measure what that does to simulated learners whose true skills we know.
//
// WHAT THIS CAN AND CANNOT SHOW. It can show how fast a policy learns who the learner is (estimation error), whether it keeps
// learners in a productive zone, how often it causes failure streaks, how much of the curriculum it covers, and how long
// simulated learners stay. It CANNOT show what truly helps real people learn: "true skill gain" depends entirely on how I made
// simulated people learn, so it is reported under three different learning rules and only trusted where the three agree.
// Learners are generated from their own random streams, so every policy faces exactly the same people (a paired comparison).
import { buildCatalog, createModel, DAY_MS, SCALE, sigmoid } from "../../src/kt/index.js";
import { SHADOW_PARAMS } from "../../src/kt/params.js";
import { pickNext } from "../../src/recommend/picker.js";
import { WEIGHTS, pickNextV2, slotFor } from "../../src/recommend/recommender2.js";
import { CONCEPTS, FLOOR, GUESS, MAX_ATTEMPTS, PROBLEMS, SLIP, WORLDS, rng, taggedProblems } from "./sim.js";

export const LEARN_RULES = {
  outcome: "failures teach a bit more (the original simulator rule)",
  zpd: "learning peaks when the problem is about 60% likely (the idea the recommender is built on)",
  constant: "every attempt teaches the same, whatever the problem",
};
const CHECKPOINTS = [10, 20, 40];

const hash = (...parts) => parts.reduce((h, x) => Math.imul(h ^ [...String(x)].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) | 0, 7), 2654435761) >>> 0, 17);

// ---------------------------------------------------------------- the policies
export const v2 = (weights, { slotted = true, tau } = {}) => ({ ctx, rand }) => {
  const r = pickNextV2({
    concepts: ctx.concepts, problems: ctx.seen, solved: ctx.solved, exclude: ctx.attempted, model: ctx.model, L: ctx.L, now: ctx.t,
    slot: slotted ? slotFor(ctx.attemptsInSession) : "core", weights, rng: rand, ...(tau ? { tau } : {}),
  });
  return r.done || r.repeated ? null : r.problem;
};
export const POLICIES = {
  "v1-production": ({ ctx, rand }) => {
    const r = pickNext({ concepts: ctx.concepts, problems: ctx.seen, difficulty: new Map(), ratings: ctx.ratings, solved: ctx.solved, exclude: ctx.attempted, explore: { rate: 0.1, rng: rand } });
    return r.done || r.repeated ? null : r.problem;
  },
  "v2-full": v2(WEIGHTS),
  "v2-no-info": v2({ ...WEIGHTS, info: 0 }),
  "v2-info-heavy": v2({ ...WEIGHTS, info: 2.0 }),
  "v2-fit-only": v2({ fit: 1, info: 0, weak: 0, review: 0, variety: 0 }, { slotted: false }),
  "random-window": ({ ctx, rand }) => {
    const open = ctx.openProblems();
    if (!open.length) return null;
    const inWindow = open.filter((p) => { const x = ctx.model.predict(ctx.L, { slug: p.slug, t: ctx.t }); return x >= 0.5 && x <= 0.8; });
    const list = inWindow.length ? inWindow : open;
    return list[Math.floor(rand() * list.length)];
  },
};

// ---------------------------------------------------------------- the simulation
export function simulatePolicy(worldName, policyName, { learners = 250, seed = 1, learnRule = "outcome", frustration = true } = {}) {
  const world = WORLDS[worldName], choose = typeof policyName === "function" ? policyName : POLICIES[policyName]; // a name from POLICIES, or a function (for experiments)
  if (!world || !choose) throw new Error(`unknown world or policy: ${worldName} / ${policyName}`);
  const worldRand = rng(seed * 7919 + 13); // the same world (problem difficulties, tags) for every policy
  const trueDifficulty = new Map(PROBLEMS.map((p) => [p.slug, p.rating + worldRand.normal(0, world.itemSd)]));
  const seen = taggedProblems(world, worldRand);
  const concepts = CONCEPTS.map((c) => ({ key: c.key, name: c.name, prerequisites: c.prerequisites }));
  const model = createModel("kt-full", SHADOW_PARAMS, buildCatalog(seen));
  const out = [];

  for (let n = 0; n < learners; n++) {
    const traits = rng(hash(seed, n, "traits")), rand = rng(hash(seed, n, "events")); // not tied to the policy: identical choices give identical outcomes
    const shared = world.correlated ? traits.normal(0, 120) : 0, topicSd = world.correlated ? 80 : 150;
    const theta = new Map(concepts.map((c) => [c.key, 950 + shared + traits.normal(0, topicSd)]));
    const theta0 = new Map(theta);
    const speed = Math.exp(traits.normal(0, 0.3));
    let t = Math.floor(traits() * 60) * DAY_MS + Math.floor(traits() * 12 * 3600e3);
    const last = new Map(), ratings = new Map(), attempts = new Map(), solved = new Set(), attempted = new Set();
    const L = model.newLearner();
    const events = [];
    const m = { attempts: 0, rmse: {}, zone: 0, maxStreak: 0, streak: 0, solved: 0, skills: new Set(), sessions: 0, badSessions: 0 };
    let sessions = 0, done = false;

    const solidTopic = (key) => { const all = seen.filter((p) => p.concept === key); return all.length === 0 || all.filter((p) => solved.has(p.slug)).length >= Math.min(2, all.length); };
    const unlockedKeys = () => new Set(concepts.filter((c) => c.prerequisites.every(solidTopic)).map((c) => c.key)); // the topics this learner can reach now

    const trueAt = (concept, now) => { // the true skill as it is at time `now` (forgetting applied without changing it)
      if (!Number.isFinite(world.halfLife) || !last.has(concept)) return theta.get(concept);
      return FLOOR + (theta.get(concept) - FLOOR) * 2 ** (-((now - last.get(concept)) / DAY_MS) / world.halfLife);
    };

    while (!done && events.length < MAX_ATTEMPTS) {
      sessions++;
      const sessionEffect = world.sessionSd ? rand.normal(0, world.sessionSd) : 0;
      const size = 3 + rand.poisson(2);
      let inSession = 0, sessionStreak = 0, sessionWorst = 0;
      for (let k = 0; k < size && events.length < MAX_ATTEMPTS; k++) {
        const ctx = {
          concepts, seen, solved, attempted, ratings, model, L, t, attemptsInSession: inSession,
          openProblems: () => { // unlocked, unsolved, not yet attempted: the same curriculum rule every policy uses
            const unlocked = unlockedKeys();
            return seen.filter((p) => !solved.has(p.slug) && !attempted.has(p.slug) && unlocked.has(p.concept));
          },
        };
        const pickedSeen = choose({ ctx, rand });
        if (!pickedSeen) { done = true; break; }
        const problem = PROBLEMS.find((p) => p.slug === pickedSeen.slug);
        const truth = world.multiTruth ? problem.skills : [{ concept: problem.concept, weight: 1 }];

        let skill = 0;
        for (const { concept, weight } of truth) { theta.set(concept, trueAt(concept, t)); skill += weight * theta.get(concept); }
        const pTrue = GUESS + (1 - GUESS - SLIP) * sigmoid((skill + sessionEffect - trueDifficulty.get(problem.slug)) / SCALE);
        const y = rand() < pTrue ? 1 : 0;
        events.push({ slug: problem.slug, t, y, pTrue });

        // true learning, under the chosen rule
        const lessonWeight = learnRule === "zpd" ? 1.5 * Math.exp(-0.5 * ((pTrue - 0.6) / 0.2) ** 2) : learnRule === "constant" ? 1 : 1 + 0.5 * (1 - y);
        for (const { concept, weight } of truth) { theta.set(concept, theta.get(concept) + speed * world.learning * weight * lessonWeight); last.set(concept, t); m.skills.add(concept); }
        // what the system believes (the new model, and the old Elo for the v1 picker)
        model.update(L, { slug: problem.slug, t }, y);
        const c = problem.concept, r = ratings.get(c) ?? 1000, a = attempts.get(c) ?? 0;
        ratings.set(c, r + (a < 10 ? 40 : 16) * (y - 1 / (1 + 10 ** ((problem.rating - r) / 400))));
        attempts.set(c, a + 1);
        attempted.add(problem.slug);
        if (y) { solved.add(problem.slug); m.solved++; }

        // bookkeeping for the measures
        m.attempts++; inSession++;
        if (pTrue >= 0.45 && pTrue <= 0.85) m.zone++;
        sessionStreak = y ? 0 : sessionStreak + 1; sessionWorst = Math.max(sessionWorst, sessionStreak); m.maxStreak = Math.max(m.maxStreak, sessionStreak);
        if (CHECKPOINTS.includes(m.attempts)) {
          // error of our picture, over the topics the learner can reach (locked topics cannot be measured by ANY policy)
          let sq = 0, count = 0;
          const reachable = unlockedKeys();
          for (const cc of concepts) if (reachable.has(cc.key)) { const e = model.view(L, cc.key, t).theta, tr = trueAt(cc.key, t); sq += (e - tr) ** 2; count++; }
          m.rmse[m.attempts] = Math.sqrt(sq / count);
          m[`gain${m.attempts}`] = concepts.reduce((s, cc) => s + (trueAt(cc.key, t) - theta0.get(cc.key)), 0) / concepts.length;
        }
        t += Math.floor((5 + rand() * 20) * 60e3);
      }
      // the next visit; some learners drift away (a little faster after a run of failures, if frustration is modelled)
      if (inSession > 0) { m.sessions++; if (sessionWorst >= 3) m.badSessions++; }
      const leave = 0.06 + (frustration && sessionWorst >= 3 ? 0.1 : 0);
      if (sessions >= 3 && rand() < leave) break;
      t += Math.floor((0.5 + rand.exp(world.gapDays ?? 3)) * DAY_MS);
    }
    out.push({
      learner: n, attempts: m.attempts, solved: m.solved, skills: m.skills.size, maxStreak: m.maxStreak, badSessionShare: m.sessions ? m.badSessions / m.sessions : null,
      zoneShare: m.attempts ? m.zone / m.attempts : null,
      rmse10: m.rmse[10] ?? null, rmse20: m.rmse[20] ?? null, rmse40: m.rmse[40] ?? null, gain20: m.gain20 ?? null, gain40: m.gain40 ?? null,
    });
  }
  return out;
}
