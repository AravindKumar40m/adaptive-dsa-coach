// HTTP-level test of the skill rating flow, through real temporary accounts. The API must be running (npm run dev).
// It resets the difficulty of peak-altitude before and after, so run it only against a DEV database.
// Run: npm run test:rating-flow
import mongoose from "mongoose";
import { config } from "../src/config.js";
import { ProblemDifficulty } from "../src/models/ProblemDifficulty.js";
import { RatingUpdate } from "../src/models/RatingUpdate.js";
import { SkillRating } from "../src/models/SkillRating.js";
import { newUser } from "./lib/client.js";

const base = `http://localhost:${config.port}/api`;
const skills = async (u) => (await u.get(`/learners/${u.learnerId}/skills`)).json;
const arrays = async (u) => (await skills(u)).skills.find((s) => s.concept === "arrays");

const GOOD = "def peak_altitude(changes):\n    best = h = 0\n    for c in changes:\n        h += c\n        best = max(best, h)\n    return best\n";
const STUB = "def peak_altitude(changes):\n    pass\n";
const SYNTAX = "def peak_altitude(changes) return 1\n";
const body = (code, extra = {}) => ({ problem: "peak-altitude", language: "python", code, ...extra });
const justNow = (secondsAgo) => new Date(Date.now() - secondsAgo * 1000).toISOString();
// independent copy of the formula, written out by hand for the expected numbers
const E = (rating, difficulty) => 1 / (1 + Math.pow(10, (difficulty - rating) / 400));

let failures = 0;
const check = (ok, label, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`); };
const near = (a, b, tol = 0.02) => Math.abs(a - b) <= tol;

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
await ProblemDifficulty.deleteOne({ problem: "peak-altitude" }); // back to the seed difficulty 900
const users = [];
const learner = async () => { const u = await newUser(base); users.push(u); return u; };

try {
  // ---- A: first submit fails completely: S = 0, E = 0.64004, K = 40 -> -25.60
  const a = await learner();
  let r = (await a.post("/submit", body(STUB, { startedAt: justNow(30) }))).json;
  check(r.verdict === "runtime_error" && r.skill?.counted === true, "A: failed submit is counted", `(${r.verdict})`);
  check(near(r.skill.before, 1000) && near(r.skill.delta, -25.6) && near(r.skill.after, 974.4), "A: rating 1000 -> 974.40 (-25.60)", `(delta ${r.skill?.delta?.toFixed(2)})`);
  check(r.skill.components.optimality === null && r.skill.components.independence === 0, "A: optimality not measurable yet; a failed submit earns no independence credit");
  let sk = await arrays(a);
  check(near(sk.rating, 974.4) && sk.attempts === 1, "A: GET skills shows arrays 974.4 after 1 attempt");
  const others = (await skills(a)).skills.filter((s) => s.concept !== "arrays");
  check(others.length === 15 && others.every((s) => s.rating === 1000 && s.attempts === 0), "A: the other 15 concepts stay at 1000");
  check(near((await ProblemDifficulty.findOne({ problem: "peak-altitude" })).difficulty, 902.56), "A: problem got harder: 900 -> 902.56");

  // ---- B: second submit is correct and quick: failsBefore 1 -> attempts part 0.7, speed 1; no hints -> independence 1
  r = (await a.post("/submit", body(GOOD, { startedAt: justNow(30) }))).json;
  const expectedS = (0.5 * 1 + 0.15 * 1 + 0.1 * (0.6 * 0.7 + 0.4 * 1)) / 0.75; // correctness + independence + efficiency
  const expectedDelta = 40 * (expectedS - E(974.4, 902.56));
  check(r.verdict === "accepted" && r.skill.counted, "B: correct submit accepted and counted");
  check(near(r.skill.score, expectedS, 0.001), "B: score S = 0.976 (second attempt, fast, no hints)", `(S ${r.skill?.score?.toFixed(4)})`);
  check(near(r.skill.delta, expectedDelta, 0.05), `B: rating goes up by ${expectedDelta.toFixed(2)}`, `(delta ${r.skill.delta?.toFixed(2)})`);
  const ratingAfterB = (await arrays(a)).rating;
  check((await skills(a)).solvedProblems?.includes("peak-altitude"), "B: the skills response lists peak-altitude as solved (the Problems page shows a tick for it)");

  // ---- C: resubmitting a solved problem changes nothing
  r = (await a.post("/submit", body(GOOD, { startedAt: justNow(30) }))).json;
  check(r.verdict === "accepted" && r.skill.counted === false && /already solved/.test(r.skill.reason), "C: resubmit after solving is not counted");
  check(near((await arrays(a)).rating, ratingAfterB, 1e-9), "C: rating unchanged");

  // ---- D: Run never changes ratings
  const d = await learner();
  r = (await d.post("/run", body(STUB))).json;
  check(r.skill === null, "D: Run response has no skill update");
  check((await arrays(d)).rating === 1000 && (await arrays(d)).attempts === 0, "D: Run left the rating at 1000");

  // ---- E: compile error is not counted
  const e = await learner();
  r = (await e.post("/submit", body(SYNTAX))).json;
  check(r.verdict === "compile_error" && r.skill.counted === false, "E: compile error is not counted", `(${r.skill?.reason})`);
  check((await arrays(e)).attempts === 0, "E: no rating row created");

  // ---- F: only the first 3 failed submits per problem count
  const f = await learner();
  const counted = [];
  for (let i = 0; i < 4; i++) counted.push((await f.post("/submit", body(STUB, { startedAt: justNow(10) }))).json.skill.counted);
  check(JSON.stringify(counted) === "[true,true,true,false]", "F: 3 failed submits count, the 4th does not", JSON.stringify(counted));
  check((await arrays(f)).attempts === 3, "F: 3 counted attempts on the concept");

  // ---- G: audit log has every input
  const rows = await RatingUpdate.find({ learnerId: a.learnerId }).sort({ createdAt: 1 }).lean();
  check(rows.length === 2 && rows[0].failsBefore === 0 && rows[1].failsBefore === 1, "G: audit log has 2 rows for learner A with failsBefore 0 then 1");
  check(near(rows[1].ratingBefore, 974.4) && near(rows[1].expected, E(974.4, 902.56), 0.001) && rows[1].k === 40 && rows[1].secondsSpent > 0 && rows[1].hintLevel === 0, "G: audit row stores before-rating, E, K, time and hint level");

  // ---- H: delete my learning data clears ratings and the audit log (the account stays)
  await a.del(`/learners/${a.learnerId}/data`);
  check((await SkillRating.countDocuments({ learnerId: a.learnerId })) === 0 && (await RatingUpdate.countDocuments({ learnerId: a.learnerId })) === 0, "H: delete-my-data removed ratings and audit rows");
  check((await skills(a)).skills.every((s) => s.rating === 1000), "H: learner A is back to 1000 everywhere");
} finally {
  for (const u of users) await u.deleteAccount();
  await ProblemDifficulty.deleteOne({ problem: "peak-altitude" }); // leave no drift behind from the test
}
console.log(failures === 0 ? "\nAll rating-flow checks passed." : `\n${failures} CHECK(S) FAILED`);
await mongoose.disconnect();
process.exit(failures === 0 ? 0 : 1);
