// HTTP test of the hint ladder and its effect on the skill rating, through real temporary accounts.
// The API must be running (npm run dev). Resets problem difficulties before/after: use a DEV database only.
// Run: npm run test:hints
import mongoose from "mongoose";
import { config } from "../src/config.js";
import { HintEvent } from "../src/models/HintEvent.js";
import { Problem } from "../src/models/Problem.js";
import { ProblemDifficulty } from "../src/models/ProblemDifficulty.js";
import { RatingUpdate } from "../src/models/RatingUpdate.js";
import { newUser } from "./lib/client.js";

const base = `http://localhost:${config.port}/api`;
const GOOD = "def peak_altitude(changes):\n    best = h = 0\n    for c in changes:\n        h += c\n        best = max(best, h)\n    return best\n";
let failures = 0;
const check = (ok, label, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`); };
const near = (a, b, tol = 0.02) => Math.abs(a - b) <= tol;
const E = (rating, difficulty) => 1 / (1 + Math.pow(10, (difficulty - rating) / 400)); // E(1000, 900) = 0.64005

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
const problem = await Problem.findOne({ slug: "peak-altitude" }).lean();
const users = [];
const learner = async () => { const u = await newUser(base); users.push(u); return u; };

try {
  check(typeof (await (await fetch(`${base}/ai/status`)).json()).enabled === "boolean", "ai/status says whether the AI explanation is switched on");

  // ---- the ladder, one level at a time
  const a = await learner();
  let r = await a.get(`/learners/${a.learnerId}/hints/peak-altitude`);
  check(r.json.revealed.length === 0 && r.json.next === 1, "a new learner has no hints revealed; level 1 is next");
  const seen = [];
  for (let level = 1; level <= 4; level++) {
    r = await a.post("/hint", { problem: "peak-altitude" });
    const last = r.json.revealed.at(-1);
    seen.push(last.level);
    check(r.json.isNew && last.level === level && last.text === problem.hints[last.key], `level ${level} (${last.label}) revealed with the stored text`, `(${r.json.revealed.length} shown, next ${r.json.next})`);
  }
  check(JSON.stringify(seen) === "[1,2,3,4]" && r.json.next === null, "levels come in order 1, 2, 3, 4 and then there is no next level");
  r = await a.post("/hint", { problem: "peak-altitude" });
  check(r.json.isNew === false && r.json.revealed.length === 4, "asking again after level 4 shows the same 4 hints and logs nothing new");
  check((await HintEvent.countDocuments({ learnerId: a.learnerId, kind: "ladder" })) === 4, "exactly 4 hint events were logged");
  r = await a.get(`/learners/${a.learnerId}/hints/peak-altitude`);
  check(r.json.revealed.length === 4, "after a page refresh the revealed hints are still there (free)");
  r = await a.get(`/learners/${a.learnerId}/hints/missing-number`);
  check(r.json.revealed.length === 0, "hints are tracked per problem");
  check((await a.post("/hint", { problem: "no-such-problem" })).status === 404, "unknown problem is 404");
  check((await a.post("/hint", { problem: "peak-altitude", learnerId: "00000000-0000-0000-0000-000000000000" })).status === 403, "asking for someone else's hints is 403");
  r = await a.post("/feedback", { problem: "peak-altitude", language: "python", code: "x = 1", result: {} });
  const enabled = (await (await fetch(`${base}/ai/status`)).json()).enabled;
  check(enabled ? [200, 403, 429, 502, 503].includes(r.status) : r.status === 503, "feedback without an API key is a clear 503, not a crash", `(status ${r.status})`);

  // ---- hints change the rating: same correct first-try solution, different help levels
  const solve = async (u) => {
    await ProblemDifficulty.deleteOne({ problem: "peak-altitude" }); // same starting difficulty for every learner
    return (await u.post("/submit", { problem: "peak-altitude", language: "python", code: GOOD, startedAt: new Date(Date.now() - 30000).toISOString() })).json;
  };
  const expectedDelta = (S) => 40 * (S - E(1000, 900));
  const none = await learner();
  let s = await solve(none);
  check(s.verdict === "accepted" && s.skill.hintLevel === 0 && near(s.skill.score, 1, 0.001) && near(s.skill.delta, expectedDelta(1), 0.05), "no hints: S = 1.000", `(delta ${s.skill?.delta?.toFixed(2)})`);

  const two = await learner();
  for (let i = 0; i < 2; i++) await two.post("/hint", { problem: "peak-altitude" });
  s = await solve(two);
  check(s.skill.hintLevel === 2 && near(s.skill.components.independence, 0.5, 1e-9) && near(s.skill.score, 0.9, 0.001) && near(s.skill.delta, expectedDelta(0.9), 0.05), "two hints (level 2): independence 0.5, S = 0.900", `(delta ${s.skill?.delta?.toFixed(2)})`);

  const four = await learner();
  for (let i = 0; i < 4; i++) await four.post("/hint", { problem: "peak-altitude" });
  s = await solve(four);
  check(s.skill.hintLevel === 4 && near(s.skill.components.independence, 0, 1e-9) && near(s.skill.score, 0.8, 0.001) && near(s.skill.delta, expectedDelta(0.8), 0.05), "all four hints: independence 0, S = 0.800", `(delta ${s.skill?.delta?.toFixed(2)})`);
  const audit = await RatingUpdate.findOne({ learnerId: four.learnerId }).lean();
  check(audit.hintLevel === 4 && audit.components.independence === 0, "the audit row records the hint level used");

  // a hint on ANOTHER problem does not hurt this one
  const other = await learner();
  await other.post("/hint", { problem: "missing-number" });
  s = await solve(other);
  check(s.skill.hintLevel === 0 && near(s.skill.score, 1, 0.001), "a hint on a different problem does not lower this problem's score");

  // ---- delete my learning data
  await a.del(`/learners/${a.learnerId}/data`);
  check((await HintEvent.countDocuments({ learnerId: a.learnerId })) === 0, "delete-my-data removes the hint events too");
} finally {
  for (const u of users) await u.deleteAccount();
  await ProblemDifficulty.deleteMany({});
}
console.log(failures === 0 ? "\nAll hint checks passed." : `\n${failures} CHECK(S) FAILED`);
await mongoose.disconnect();
process.exit(failures === 0 ? 0 : 1);
