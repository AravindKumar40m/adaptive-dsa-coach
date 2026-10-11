// What happens to v2 when ONE setting is changed at a time? A sanity check on the design (is a weight badly chosen?), not a tuning
// session: settings are NOT picked from this to claim a win (that would just overfit my simulator).   npm run policies:sensitivity
import { POLICIES, simulatePolicy, v2 } from "./policy-sim.js";
import { WEIGHTS } from "../../src/recommend/recommender2.js";

const seeds = [11, 12], learners = 200;
const world = "W4-realistic";
const variants = {
  "v1-production (reference)": "v1-production",
  "v2 default": v2(WEIGHTS),
  "info 0": v2({ ...WEIGHTS, info: 0 }), "info 1.5": v2({ ...WEIGHTS, info: 1.5 }),
  "weak 0": v2({ ...WEIGHTS, weak: 0 }), "weak 1.0": v2({ ...WEIGHTS, weak: 1.0 }),
  "variety 0": v2({ ...WEIGHTS, variety: 0 }), "variety 0.8": v2({ ...WEIGHTS, variety: 0.8 }),
  "review 0": v2({ ...WEIGHTS, review: 0 }), "review 1.0": v2({ ...WEIGHTS, review: 1.0 }),
  "temperature 0.05 (sharper)": v2(WEIGHTS, { tau: 0.05 }), "temperature 0.4 (looser)": v2(WEIGHTS, { tau: 0.4 }),
  "no session arc": v2(WEIGHTS, { slotted: false }),
};
const metrics = [["rmse40", "err@40", 1], ["gain40", "gain@40", 1], ["zoneShare", "zone", 3], ["badSessionShare", "badSess", 3], ["attempts", "attempts", 1], ["skills", "skills", 1], ["solved", "solved", 1]];
const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
const sd = (xs) => { const m = mean(xs); return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, xs.length - 1)); };

for (const rule of ["outcome", "zpd"]) {
  const res = {};
  for (const [name, policy] of Object.entries(variants)) {
    res[name] = new Map();
    for (const seed of seeds) for (const r of simulatePolicy(world, policy, { learners, seed, learnRule: rule })) res[name].set(`${seed}-${r.learner}`, r);
  }
  const base = res["v1-production (reference)"];
  console.log(`\n${world}, learning rule "${rule}": difference from today's picker (paired, ${seeds.length * learners} learners), * = beyond 2 standard errors`);
  console.log("variant".padEnd(30) + metrics.map(([, l]) => l.padStart(14)).join(""));
  for (const [name, byLearner] of Object.entries(res)) {
    let line = name.padEnd(30);
    for (const [key, , d] of metrics) {
      const diffs = [...byLearner].map(([k, r]) => (r[key] != null && base.get(k)?.[key] != null ? r[key] - base.get(k)[key] : null)).filter((x) => x != null && Number.isFinite(x));
      const m = mean(diffs), se = sd(diffs) / Math.sqrt(diffs.length);
      line += `${m >= 0 ? "+" : ""}${m.toFixed(d)}${Math.abs(m) > 2 * se ? "*" : " "}`.padStart(14);
    }
    console.log(name === "v1-production (reference)" ? "(today's picker: the zero line)" : line);
  }
}
