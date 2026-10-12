// The progress endpoint end to end through real accounts and Judge0: mistakes, help used, review due, pace, access and deletion.
// Starts its own API copy on port 4111 (your dev server is not touched). Test accounts end in @example.test and are removed afterwards.
// The pace and review checks write synthetic timestamps for a TEST account only.   Run: npm run test:progress-flow
import { spawn } from "node:child_process";
import mongoose from "mongoose";
import { config } from "../../src/config.js";
import { CodeSnapshot } from "../../src/models/CodeSnapshot.js";
import { ProblemDifficulty } from "../../src/models/ProblemDifficulty.js";
import { ReferenceSolution } from "../../src/models/ReferenceSolution.js";
import { Submission } from "../../src/models/Submission.js";
import { newUser } from "../lib/client.js";

let failures = 0;
const check = (ok, label, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (url) => { for (let i = 0; i < 40; i++) { try { if ((await fetch(url)).status > 0) return; } catch { await sleep(250); } } };
const solution = async (slug) => (await ReferenceSolution.findOne({ problem: slug, language: "python", approach: "optimal" }).lean()).code;
const WRONG = "def peak_altitude(changes):\n    return -999\n";
const CRASH = "def peak_altitude(changes):\n    return changes[len(changes) + 5]\n";
const DAY = 86_400_000, MIN = 60_000;

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
const api = spawn(process.execPath, ["src/index.js"], { env: { ...process.env, PORT: "4111", PICKER_EXPLORE_RATE: "0" }, stdio: ["ignore", "ignore", "pipe"] });
const base = "http://localhost:4111/api";
const users = [];
const learner = async () => { const u = await newUser(base); users.push(u); return u; };
const progress = (u) => u.get(`/learners/${u.learnerId}/progress`).then((r) => r.json);

try {
  await ProblemDifficulty.deleteMany({});
  await waitFor(`${base}/health`);

  // ---------------------------------------------------------------- access
  const a = await learner();
  const anon = await fetch(`${base}/learners/${a.learnerId}/progress`);
  check(anon.status === 401, "without a login: 401");
  check((await a.get("/learners/00000000-0000-0000-0000-000000000000/progress")).status === 403, "someone else's progress: 403");
  check((await a.get("/learners/x/progress")).status === 403 || (await a.get("/learners/x/progress")).status === 400, "a malformed id is refused");

  // ---------------------------------------------------------------- a brand-new learner
  let p = await progress(a);
  check(p.skills.length === 16 && p.skills.every((s) => s.rating === 1000 && s.attempts === 0) && p.totals.solved === 0 && p.totals.problems === 120, "a new learner: 16 topics at 1000, nothing solved, 120 problems in the library");
  check(p.strongest === null && p.weakest === null && p.mistakes.failedAttempts === 0 && p.review.due.length === 0 && p.pace.week.pointsPerHour === null && p.independence.firstTry.of === 0, "and no strongest/weakest, no mistakes, no review, no pace");
  check(p.skills.find((s) => s.concept === "arrays").unlocked && !p.skills.find((s) => s.concept === "dp").unlocked, "arrays is open and dp is locked");

  // ---------------------------------------------------------------- a short session: failures, a crash, a solve, a solve with two hints
  const started = () => new Date(Date.now() - 40_000).toISOString();
  await a.post("/run", { problem: "peak-altitude", language: "python", code: WRONG, startedAt: started() });
  await a.post("/run", { problem: "peak-altitude", language: "python", code: WRONG, startedAt: started() });
  await a.post("/run", { problem: "peak-altitude", language: "python", code: CRASH, startedAt: started() });
  const s1 = (await a.post("/submit", { problem: "peak-altitude", language: "python", code: await solution("peak-altitude"), startedAt: started() })).json;
  check(s1.verdict === "accepted", "setup: peak-altitude solved after 2 wrong answers and 1 crash");
  await a.post("/hint", { problem: "missing-number" }); await a.post("/hint", { problem: "missing-number" });
  const s2 = (await a.post("/submit", { problem: "missing-number", language: "python", code: await solution("missing-number"), startedAt: started() })).json;
  check(s2.verdict === "accepted" && s2.skill.hintLevel === 2, "setup: missing-number solved with two hints");

  p = await progress(a);
  const arrays = p.skills.find((s) => s.concept === "arrays");
  check(p.totals.solved === 2 && arrays.solved === 2 && arrays.attempts === 2 && arrays.rating > 1000, "two solved, arrays rated above 1000 after its 2 rated Submits (Runs never count)", `(rating ${arrays.rating}, ${arrays.attempts} attempts)`);
  check(arrays.chance === Math.round(100 / (1 + 10 ** ((1200 - arrays.rating) / 400))), "its 'chance of a typical medium' is the Elo value for that rating", `(${arrays.chance}%)`);
  const top = Object.fromEntries(p.mistakes.top.map((m) => [m.key, m.count]));
  check(p.mistakes.failedAttempts === 3 && top.wrong_answer === 2 && top.index_out_of_range === 1, "mistakes: 2 wrong answers and 1 index error", JSON.stringify(top));
  check(p.mistakes.mostCommonCrash?.key === "index_out_of_range" && /Index out of range/.test(p.mistakes.mostCommonCrash.label), "the mistake to watch is the index error, in plain words");
  check(p.independence.solvedProblems === 2 && p.independence.buckets.none === 1 && p.independence.buckets.two === 1, "help: one solve with no hint, one with level 2");
  check(p.independence.firstTry.of === 2 && p.independence.firstTry.count === 2, "both problems were solved on their first Submit (the failures were Runs)");
  check(p.review.due.length === 0 && p.review.upcoming.length === 1 && p.review.upcoming[0].concept === "arrays" && p.review.upcoming[0].dueInDays > 0.9 && p.review.upcoming[0].dueInDays <= 1.01, "review: arrays comes back in about a day", JSON.stringify(p.review.upcoming));
  check(p.pace.week.enough === false && p.pace.week.pointsPerHour === null && p.pace.week.points > 0, "pace: a minute or two of work is too little for a rate, but the points gained show", JSON.stringify(p.pace.week));
  check(p.strongest === null, "only one topic practised: no strongest/weakest yet");

  // ---------------------------------------------------------------- time travel (TEST account only): 24 more minutes of work, and the solves 2 days old
  const now = Date.now();
  await CodeSnapshot.collection.insertMany(Array.from({ length: 25 }, (_, i) => ({ learnerId: a.learnerId, problem: "peak-altitude", language: "python", code: `x${i}`, hash: `t${i}`, createdAt: new Date(now - 30 * MIN + i * MIN) })));
  p = await progress(a);
  check(p.pace.week.enough && p.pace.week.engagedMin >= 24 && typeof p.pace.week.pointsPerHour === "number" && p.pace.week.pointsPerHour > 0, "with 24+ minutes of recorded work the pace becomes a number", JSON.stringify(p.pace.week));
  await Submission.collection.updateMany({ learnerId: a.learnerId, verdict: "accepted" }, { $set: { createdAt: new Date(now - 2 * DAY) } });
  p = await progress(a);
  check(p.review.due.length === 1 && p.review.due[0].concept === "arrays" && p.review.due[0].dueInDays <= -0.9, "two days later arrays is due for review", JSON.stringify(p.review.due));

  // ---------------------------------------------------------------- two practised topics: strongest and weakest appear
  const b = await learner();
  await b.post("/submit", { problem: "peak-altitude", language: "python", code: await solution("peak-altitude"), startedAt: started() });
  await b.post("/submit", { problem: "peak-altitude", language: "python", code: await solution("peak-altitude"), startedAt: started() }); // already solved: not counted
  for (const slug of ["peak-altitude", "missing-number"]) await b.post("/submit", { problem: slug, language: "python", code: await solution(slug), startedAt: started() });
  const strings = (await b.get("/problems?concept=strings")).json?.[0]?.slug;
  if (strings) {
    // a failed Submit in a second topic gives that topic a lower rating than arrays
    const fail = await b.post("/submit", { problem: strings, language: "python", code: "def x(s):\n    return 0\n", startedAt: started() });
    const pb = await progress(b);
    check(fail.status === 200 && pb.strongest?.concept === "arrays" && pb.weakest?.concept === "strings" && pb.strongest.rating > pb.weakest.rating, "after a failed Submit in a second topic: strongest = arrays, weakest = strings", JSON.stringify([pb.strongest, pb.weakest]));
  }

  // ---------------------------------------------------------------- deleting the data empties the page again
  check((await a.del(`/learners/${a.learnerId}/data`)).status === 200, "delete my data works");
  p = await progress(a);
  check(p.totals.solved === 0 && p.mistakes.failedAttempts === 0 && p.pace.allTime.engagedMin === 0 && p.review.due.length === 0 && p.skills.every((s) => s.rating === 1000), "afterwards the progress page is empty again (no snapshots, ratings or history left)");
} finally {
  for (const u of users) await u.deleteAccount().catch(() => {});
  api.kill();
  await ProblemDifficulty.deleteMany({});
  await mongoose.disconnect();
}
console.log(failures === 0 ? "\nALL PROGRESS-FLOW CHECKS PASSED" : `\n${failures} PROGRESS-FLOW CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
