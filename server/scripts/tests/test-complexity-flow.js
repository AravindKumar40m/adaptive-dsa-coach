// The scaling check end to end through real accounts and Judge0: who may ask, what is measured, the verdicts for a fast and a slow
// solution, the cache, a correct solution that crashes on big inputs, the Progress page summary, and deletion.
// Starts its own API copy on port 4116 (your dev server is not touched). Test accounts end in @example.test and are removed afterwards.
// Run: npm run test:complexity-flow
import { spawn } from "node:child_process";
import mongoose from "mongoose";
import { config } from "../../src/config.js";
import { ComplexityMeasurement } from "../../src/models/ComplexityMeasurement.js";
import { ProblemDifficulty } from "../../src/models/ProblemDifficulty.js";
import { ReferenceSolution } from "../../src/models/ReferenceSolution.js";
import { SkillRating } from "../../src/models/SkillRating.js";
import { newUser } from "../lib/client.js";

let failures = 0;
const check = (ok, label, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (url) => { for (let i = 0; i < 40; i++) { try { if ((await fetch(url)).status > 0) return; } catch { await sleep(250); } } };
const ref = async (problem, language, approach) => (await ReferenceSolution.findOne({ problem, language, approach }).lean()).code;

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
const api = spawn(process.execPath, ["src/index.js"], { env: { ...process.env, PORT: "4116", PICKER_EXPLORE_RATE: "0" }, stdio: ["ignore", "ignore", "pipe"] });
const base = "http://localhost:4116/api";
const users = [];
const learner = async () => { const u = await newUser(base); users.push(u); return u; };
const submit = (u, problem, language, code) => u.post("/submit", { problem, language, code, startedAt: new Date(Date.now() - 30000).toISOString() });
const RECURSIVE = "def peak_altitude(changes):\n    def go(i, h, best):\n        if i == len(changes):\n            return best\n        h += changes[i]\n        return go(i + 1, h, max(best, h))\n    return go(0, 0, 0)\n";

try {
  await ProblemDifficulty.deleteMany({});
  await waitFor(`${base}/health`);
  const a = await learner();

  // ---------------------------------------------------------------- when is the check offered?
  const fast = (await submit(a, "peak-altitude", "python", await ref("peak-altitude", "python", "optimal"))).json;
  check(fast.verdict === "accepted" && fast.complexity?.available === true && typeof fast.submissionId === "string", "a correct Python Submit of a configured problem offers the scaling check (and returns the Submit's id)");
  check((await submit(a, "peak-altitude", "javascript", await ref("peak-altitude", "javascript", "optimal"))).json.complexity.available === false, "the same problem solved in JavaScript: not offered (Python only for now)");
  check((await submit(a, "peak-altitude", "python", "def peak_altitude(changes):\n    return -1\n")).json.complexity.available === false, "a wrong solution: not offered");
  const run = (await a.post("/run", { problem: "peak-altitude", language: "python", code: await ref("peak-altitude", "python", "optimal") })).json;
  check(run.complexity === undefined || run.complexity.available === false, "a Run (not a Submit): not offered");
  const other = (await submit(a, "fair-capacity", "python", await ref("fair-capacity", "python", "optimal"))).json;
  check(other.verdict === "accepted" && other.complexity.available === false, "a correct solution of a problem with no size generator: not offered");

  // ---------------------------------------------------------------- the fast solution
  const ratingBefore = (await SkillRating.findOne({ learnerId: a.learnerId, concept: "arrays" }).lean()).rating;
  let r = await a.post("/complexity", { submission: fast.submissionId });
  check(r.status === 201 && r.json.verdict === "matches" && r.json.cached === false, "the fast solution: verdict 'matches'", JSON.stringify([r.status, r.json.verdict, r.json.label]));
  check(r.json.points.length >= 8 && r.json.measuredUpTo === 100000 && r.json.points.every((p) => p.n > 0 && p.ms > 0) && /as good as/.test(r.json.message), "it was timed at 8+ sizes up to n = 100,000 and the message says it is as good as the usual best", `(${r.json.points.length} sizes)`);
  check(!JSON.stringify(r.json).includes("make") && !/_make|rng/.test(JSON.stringify(r.json)), "nothing of the input generator is sent to the browser");
  const again = await a.post("/complexity", { submission: fast.submissionId });
  check(again.status === 200 && again.json.cached === true && again.json.verdict === "matches" && (await ComplexityMeasurement.countDocuments({ learnerId: a.learnerId, submissionId: fast.submissionId })) === 1, "asking again for the same Submit returns the stored result (cached) and runs nothing");
  check((await SkillRating.findOne({ learnerId: a.learnerId, concept: "arrays" }).lean()).rating === ratingBefore, "the scaling check does not change the rating");

  // ---------------------------------------------------------------- the slow solution (and the stored code is what is measured)
  const slow = (await submit(a, "pair-count", "python", await ref("pair-count", "python", "brute"))).json;
  check(slow.verdict === "accepted" && slow.complexity.available, "setup: the brute-force pair-count passes every test");
  r = await a.post("/complexity", { submission: slow.submissionId, code: await ref("pair-count", "python", "optimal") });
  const times = Number((r.json.message.match(/about ([\d,]+) times longer/) ?? [])[1]?.replace(/,/g, ""));
check(r.status === 201 && r.json.verdict === "slow" && r.json.label === "n²" && /passed the tests/.test(r.json.message) && times >= 70 && times <= 150, "the slow solution: verdict 'slow', grows like n², 'passed the tests', and 10x the input is said to take roughly 100x longer", r.json.message);
  check(r.json.verdict === "slow", "code sent along in the request body is ignored: the STORED solution was measured (the fast one we sent would have matched)");

  // ---------------------------------------------------------------- who may ask
  check((await fetch(`${base}/complexity`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ submission: fast.submissionId }) })).status === 401, "without a login: 401");
  check((await a.post("/complexity", { submission: "nope" })).status === 400, "a malformed id: 400");
  const b = await learner();
  check((await b.post("/complexity", { submission: fast.submissionId })).status === 404, "someone else's Submit: 404");
  check((await a.post("/complexity", { submission: "5f1d7f3e8a0b1c2d3e4f5a6b" })).status === 404, "an id that does not exist: 404");
  const jsSub = (await submit(a, "peak-altitude", "javascript", await ref("peak-altitude", "javascript", "optimal"))).json;
  r = await a.post("/complexity", { submission: jsSub.submissionId });
  check(r.status === 422 && /Python/.test(r.json.error), "a JavaScript Submit: 422, 'Python for now'");
  const wrongSub = (await submit(a, "peak-altitude", "python", "def peak_altitude(changes):\n    return -1\n")).json;
  check((await a.post("/complexity", { submission: wrongSub.submissionId })).status === 422, "a wrong solution: 422");
  check((await a.post("/complexity", { submission: other.submissionId })).status === 422, "a problem without a size generator: 422");
  check((await a.post("/complexity", { submission: run.submissionId })).status === 404, "a Run's id (not a Submit): 404");

  // ---------------------------------------------------------------- a correct solution that crashes on big inputs
  const rec = (await submit(b, "peak-altitude", "python", RECURSIVE)).json;
  check(rec.verdict === "accepted" && rec.complexity.available, "setup: a recursive peak-altitude passes every test (they are small)");
  r = await b.post("/complexity", { submission: rec.submissionId });
  check(r.status === 201 && ["unclear", "unmeasured"].includes(r.json.verdict) && /RecursionError/.test(r.json.message), "a recursive solution that hits Python's recursion limit on bigger inputs: 'unclear', and the error is named", r.json.message);

  // ---------------------------------------------------------------- the Progress page
  const p = (await a.get(`/learners/${a.learnerId}/progress`)).json;
  check(p.scaling.checked === 2 && p.scaling.matches === 1 && p.scaling.slow === 1 && p.scaling.items.some((i) => i.problem === "pair-count" && i.verdict === "slow") && p.scaling.items.some((i) => i.problem === "peak-altitude" && i.verdict === "matches"), "the Progress report counts 1 as good as expected and 1 slower than it could be, with the problem titles", JSON.stringify(p.scaling.items.map((i) => [i.title, i.verdict])));
  check((await a.get(`/learners/${b.learnerId}/progress`)).status === 403, "(access) another learner's progress is refused");

  // ---------------------------------------------------------------- deletion
  const row = await ComplexityMeasurement.findOne({ learnerId: a.learnerId }).lean();
  check(row.version === "complexity-1" && row.configVersion === "complexity-cfg-1" && row.points.length >= 3 && row.wallMs > 0 && row.judgeStatus === 3, "the stored measurement has the points, the timing, Judge0's status and both version tags");
  check((await a.del(`/learners/${a.learnerId}/data`)).status === 200 && (await ComplexityMeasurement.countDocuments({ learnerId: a.learnerId })) === 0, "delete my data removes the measurements");
  check((await a.get(`/learners/${a.learnerId}/progress`)).json.scaling.checked === 0, "and the Progress page is empty again");
} finally {
  for (const u of users) await u.deleteAccount().catch(() => {});
  api.kill();
  await ProblemDifficulty.deleteMany({});
  await mongoose.disconnect();
}
console.log(failures === 0 ? "\nALL COMPLEXITY-FLOW CHECKS PASSED" : `\n${failures} COMPLEXITY-FLOW CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
