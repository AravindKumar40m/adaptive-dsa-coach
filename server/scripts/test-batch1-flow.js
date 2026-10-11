// Batch 1 end to end through real accounts: code snapshots, the struggle nudge, spaced review, the "why" text, and metrics.
// Needs MongoDB and Judge0. Starts two extra API copies (4109: normal, 4110: PICKER_REVIEW=off); your dev server is not touched.
// Test accounts end in @example.test and are removed afterwards. The review checks move a TEST account's solve 2 days
// into the past (that is the only way to test "due after a day" without waiting).  Run: npm run test:batch1-flow
import { spawn } from "node:child_process";
import mongoose from "mongoose";
import { config } from "../src/config.js";
import { CONSENT_VERSION } from "../src/consent.js";
import { whoHash } from "../src/metrics.js";
import { CodeSnapshot } from "../src/models/CodeSnapshot.js";
import { MetricEvent } from "../src/models/MetricEvent.js";
import { ProblemDifficulty } from "../src/models/ProblemDifficulty.js";
import { ProblemEvent } from "../src/models/ProblemEvent.js";
import { RecommendationEvent } from "../src/models/RecommendationEvent.js";
import { ReferenceSolution } from "../src/models/ReferenceSolution.js";
import { Submission } from "../src/models/Submission.js";
import { LOGGING_VERSION, PICKER_VERSION } from "../src/versions.js";
import { makeClient, newUser } from "./lib/client.js";

let failures = 0;
const check = (ok, label, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (url) => { for (let i = 0; i < 40; i++) { try { if ((await fetch(url)).status > 0) return; } catch { await sleep(250); } } };
const spawnApi = (port, env) => spawn(process.execPath, ["src/index.js"], { env: { ...process.env, PORT: String(port), PICKER_EXPLORE_RATE: "0", ...env }, stdio: ["ignore", "ignore", "pipe"] });
const solution = async (slug) => (await ReferenceSolution.findOne({ problem: slug, language: "python", approach: "optimal" }).lean()).code;
const WRONG = "def peak_altitude(changes):\n    return -999\n"; // fails every test the same way: never "making progress"
const DAY = 86_400_000;

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
const apis = [spawnApi(4109, {}), spawnApi(4110, { PICKER_REVIEW: "off" })];
const base = "http://localhost:4109/api";
const users = [];
const learner = async () => { const u = await newUser(base); users.push(u); return u; };
const next = (u, q = "") => u.get(`/learners/${u.learnerId}/next${q}`).then((r) => r.json);
const submitGood = async (u, slug, ago = 30000) => (await u.post("/submit", { problem: slug, language: "python", code: await solution(slug), startedAt: new Date(Date.now() - ago).toISOString() })).json;

try {
  await ProblemDifficulty.deleteMany({});
  await Promise.all([4109, 4110].map((p) => waitFor(`http://localhost:${p}/api/health`)));

  // ---------------------------------------------------------------- consent wording and version
  const consent = await (await fetch(`${base}/consent`)).json();
  const text = JSON.stringify(consent);
  check(consent.version === CONSENT_VERSION && CONSENT_VERSION === "2026-10-12", "the consent version was bumped", `(${consent.version})`);
  check(/30 seconds/.test(text) && /suggest a hint/.test(text) && /14 days/.test(text), "and the wording names the code copies, the hint suggestions and the timing data");

  // ---------------------------------------------------------------- code snapshots
  const a = await learner();
  const CODE1 = "def peak_altitude(c):\n    return 1\n";
  const snap = (u, over = {}) => u.post("/snapshot", { problem: "peak-altitude", language: "python", code: CODE1, trigger: "timer", msSinceOpen: 31000, ...over });
  let r = await snap(a);
  check(r.status === 201 && r.json.stored && r.json.seq === 1, "a snapshot is stored (seq 1)", `(${r.status} ${JSON.stringify(r.json)})`);
  const row = await CodeSnapshot.findOne({ learnerId: a.learnerId }).lean();
  check(row.code === CODE1 && row.chars === CODE1.length, "it keeps the code and its size");
  check(row.hash?.length === 64 && row.trigger === "timer" && row.msSinceOpen === 31000 && row.loggingVersion === LOGGING_VERSION && row.sessionId, "with a hash, the trigger, time since opening, the logging version and the session", `(${row.loggingVersion})`);
  r = await snap(a);
  check(r.status === 200 && r.json.stored === false && r.json.reason === "unchanged" && (await CodeSnapshot.countDocuments({ learnerId: a.learnerId })) === 1, "the same code twice in a row is not stored twice");
  r = await snap(a, { code: "def peak_altitude(c):\n    return 2\n", trigger: "switch" });
  check(r.status === 201 && r.json.seq === 2, "changed code is stored (seq 2)");
  check((await snap(a, { language: "ruby" })).status === 400, "unknown language: 400");
  check((await snap(a, { code: "   " })).status === 400 && (await snap(a, { code: 5 })).status === 400, "empty or non-text code: 400");
  check((await snap(a, { code: "x".repeat(20001) })).status === 400, "code over 20,000 characters: 400");
  check((await snap(a, { trigger: "whenever" })).status === 400, "unknown trigger: 400");
  check((await snap(a, { problem: "no-such-problem" })).status === 404, "unknown problem: 404");
  check((await snap(a, { learnerId: "00000000-0000-0000-0000-000000000000", code: "other" })).status === 403, "writing as someone else: 403");
  const anon = await fetch(`${base}/snapshot`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ problem: "peak-altitude", language: "python", code: "x", trigger: "timer" }) });
  check(anon.status === 401, "without a login: 401");
  r = await snap(a, { code: "def peak_altitude(c):\n    return 3\n", msSinceOpen: 99 * 3600_000 });
  check((await CodeSnapshot.findOne({ learnerId: a.learnerId }).sort({ createdAt: -1 }).lean()).msSinceOpen === 6 * 3600_000, "an absurd 'time since opening' is clamped to 6 hours");

  const capped = await learner();
  await CodeSnapshot.collection.insertMany(Array.from({ length: 400 }, (_, i) => ({ learnerId: capped.learnerId, problem: "missing-number", language: "python", code: `v${i}`, hash: `h${i}`, createdAt: new Date() })));
  r = await snap(capped, { problem: "missing-number", code: "def f(x):\n    return 1\n" });
  check(r.status === 200 && r.json.stored === false && r.json.reason === "limit", "after 400 snapshots on one problem, no more are stored");

  const flooder = await learner();
  let last = 0;
  for (let i = 0; i < 245; i++) { last = (await snap(flooder, { code: `def peak_altitude(c):\n    return ${i}\n` })).status; if (last === 429) { check(i === 240, "the 241st snapshot in an hour is refused with 429", `(refused at #${i + 1})`); break; } }
  check(last === 429, "a flood of snapshots is stopped");

  // ---------------------------------------------------------------- the struggle nudge
  const b = await learner();
  const run = (u, over = {}) => u.post("/run", { problem: "peak-altitude", language: "python", code: WRONG, startedAt: new Date(Date.now() - 400_000).toISOString(), ...over });
  const n1 = (await run(b)).json, n2 = (await run(b)).json;
  check(n1.verdict === "wrong_answer" && n1.nudge === null && n2.nudge === null, "two failed attempts: no nudge yet");
  const n3 = (await run(b)).json;
  check(n3.nudge && n3.nudge.level === 1 && n3.nudge.rule === "struggle-1" && /Stuck for a while\?/.test(n3.nudge.text) && /independence/.test(n3.nudge.text), "the third failed attempt (400 s in, no progress) suggests hint level 1, and says what it costs", `("${n3.nudge?.text}")`);
  const shown = await ProblemEvent.find({ learnerId: b.learnerId, kind: "nudge_shown" }).lean();
  check(shown.length === 1 && shown[0].value.level === 1 && shown[0].value.failedAttempts === 3 && shown[0].value.noProgress === true && shown[0].value.expectedSeconds === 600, "the offer is logged with the signals behind it");
  check((await run(b)).json.nudge === null, "a fourth failure right after: no second nudge (10-minute gap)");
  check((await b.post("/problem-event", { problem: "peak-altitude", kind: "nudge_taken", value: "hints" })).status === 201 && (await b.post("/problem-event", { problem: "peak-altitude", kind: "nudge_dismissed", value: "not_now" })).status === 201, "'Open the hints' and 'Not now' are recorded");
  check((await b.post("/problem-event", { problem: "peak-altitude", kind: "nudge_shown", value: "x" })).status === 400, "a browser cannot invent a nudge offer");
  check((await b.post("/problem-event", { problem: "peak-altitude", kind: "nudge_taken", value: "maybe" })).status === 400, "a bad answer value is refused");
  const taken = await ProblemEvent.findOne({ learnerId: b.learnerId, kind: "nudge_taken" }).lean();
  check(taken?.value === "hints", "and stored");

  const c = await learner();
  for (let i = 0; i < 3; i++) await run(c, { startedAt: undefined });
  check((await ProblemEvent.countDocuments({ learnerId: c.learnerId, kind: "nudge_shown" })) === 0, "no start time from the browser: never a nudge");
  const d = await learner();
  await d.post("/hint", { problem: "peak-altitude" }); await d.post("/hint", { problem: "peak-altitude" });
  for (let i = 0; i < 3; i++) await run(d);
  check((await ProblemEvent.countDocuments({ learnerId: d.learnerId, kind: "nudge_shown" })) === 0, "with hint level 2 already open: no nudge");
  const e = await learner();
  await run(e); await run(e);
  const good = (await e.post("/run", { problem: "peak-altitude", language: "python", code: await solution("peak-altitude"), startedAt: new Date(Date.now() - 400_000).toISOString() })).json;
  check(good.verdict === "accepted" && good.nudge === null, "a passing run never gets a nudge");
  const f = await learner();
  for (let i = 0; i < 3; i++) await run(f, { startedAt: new Date(Date.now() - 100_000).toISOString() });
  check((await ProblemEvent.countDocuments({ learnerId: f.learnerId, kind: "nudge_shown" })) === 0, "100 s in, three failures: too early, no nudge");

  // ---------------------------------------------------------------- spaced review
  const g = await learner();
  const solved1 = await submitGood(g, "peak-altitude");
  check(solved1.verdict === "accepted" && solved1.skill.counted, "setup: the learner solves peak-altitude");
  let rec = await next(g);
  check(rec.mode !== "review" && rec.problem.slug !== "peak-altitude", "right after a solve nothing is due: a normal pick", `(${rec.mode}: ${rec.problem?.slug})`);
  check(/Your last .+ problem \(".+"\) was earlier today, with no help\./.test(rec.reason), "the reason now includes a fact about the learner's last solve in that topic", `"${rec.reason}"`);
  const row1 = await RecommendationEvent.findById(rec.recommendationId).lean();
  check(row1.pickerVersion === PICKER_VERSION && PICKER_VERSION === "picker-3", "and the log row carries the new picker version");

  // time travel: the solve happened 2 days ago, so the 1-day review is due
  await Submission.collection.updateOne({ learnerId: g.learnerId, problem: "peak-altitude", verdict: "accepted" }, { $set: { createdAt: new Date(Date.now() - 2 * DAY) } });
  await RecommendationEvent.deleteMany({ learnerId: g.learnerId });
  rec = await next(g);
  check(rec.mode === "review" && rec.review?.concept === "arrays" && rec.review.stage === 0 && rec.review.intervalDays === 1 && rec.review.repeat === false, "2 days later the Arrays review is due: a review is offered", `(${rec.problem?.slug})`);
  check(/Arrays review/.test(rec.reason) && /2 days ago/.test(rec.reason) && /fresh Arrays problem/.test(rec.reason), "and the reason explains why", `"${rec.reason}"`);
  check(rec.problem.slug !== "peak-altitude" && rec.expectedSuccess >= 0.55, "it is a different, doable problem");
  const row2 = await RecommendationEvent.findById(rec.recommendationId).lean();
  check(row2.mode === "review" && row2.review?.concept === "arrays" && row2.candidates.length >= 1 && row2.propensity === 1 && row2.explored === false, "the review pick is logged with its details and candidates");
  const again = await next(g);
  check(again.reused === true && again.problem.slug === rec.problem.slug && again.mode === "review" && again.review?.concept === "arrays" && (await RecommendationEvent.countDocuments({ learnerId: g.learnerId })) === 1, "asking again returns the same review (with its details) and logs nothing new");
  const skipped = await next(g, `?exclude=${rec.problem.slug}`);
  check(skipped.problem.slug !== rec.problem.slug, "skipping the review problem gives another one");

  // doing the review moves the topic to stage 1 (next review after 3 days)
  const done = await submitGood(g, rec.problem.slug);
  check(done.verdict === "accepted" && done.skill.counted, "the learner solves the review problem");
  const after = await next(g);
  check(after.mode !== "review", "afterwards nothing is due and no review follows (a clean review moved the topic to a 3-day wait)", `(${after.mode})`);

  // never more than 1 review in 3 picks, and PICKER_REVIEW=off turns reviews off
  const h = await learner();
  await submitGood(h, "peak-altitude");
  await Submission.collection.updateOne({ learnerId: h.learnerId, problem: "peak-altitude", verdict: "accepted" }, { $set: { createdAt: new Date(Date.now() - 2 * DAY) } });
  const at = (ms) => new Date(Date.now() - ms);
  await RecommendationEvent.collection.insertMany([{ learnerId: h.learnerId, mode: "review", done: false, createdAt: at(20 * 60_000) }, { learnerId: h.learnerId, mode: "weakest", done: false, createdAt: at(10 * 60_000) }]);
  check((await next(h)).mode !== "review", "a review 2 recommendations ago: the topic is due but another review must wait");
  await RecommendationEvent.deleteMany({ learnerId: h.learnerId });
  await RecommendationEvent.collection.insertMany([{ learnerId: h.learnerId, mode: "weakest", done: false, createdAt: at(20 * 60_000) }, { learnerId: h.learnerId, mode: "weakest", done: false, createdAt: at(10 * 60_000) }]);
  check((await next(h)).mode === "review", "two normal picks since the last review: the due review is offered");
  await RecommendationEvent.deleteMany({ learnerId: h.learnerId });
  const off = makeClient("http://localhost:4110/api", { email: h.email, password: h.password, learnerId: h.learnerId, cookie: h.cookie });
  check((await off.get(`/learners/${h.learnerId}/next`)).json.mode !== "review", "with PICKER_REVIEW=off the same learner is never offered a review");

  // ---------------------------------------------------------------- metrics
  await sleep(500); // metric rows are written after the response
  const names = await MetricEvent.distinct("name", { kind: "http", who: whoHash(g.learnerId) });
  check(names.includes("POST /api/submit") && names.includes("GET /api/learners/:learnerId/next"), "request timings use route patterns, not real ids", names.join(" | "));
  check(!names.some((n) => n.includes(g.learnerId)) && !(await MetricEvent.exists({ who: g.learnerId })), "no row contains the learner id or email");
  check(!(await MetricEvent.exists({ kind: "http", name: /health/ })), "the page's constant /health polling is not recorded");
  const j = await MetricEvent.findOne({ kind: "judge0", who: whoHash(g.learnerId) }).lean();
  check(j && j.ok === true && j.ms > 0 && j.extra.execSec >= 0 && j.extra.overheadMs >= 0 && /^lang\d+$/.test(j.name), "Judge0 timings include the program's own time and the waiting overhead", JSON.stringify(j?.extra));
  const slow = await MetricEvent.findOne({ kind: "http", name: "POST /api/submit", who: whoHash(g.learnerId) }).lean();
  check(slow.ms > 50 && slow.status === 200 && slow.ok === true, "a submit shows its real duration and status", `(${slow?.ms} ms)`);

  // ---------------------------------------------------------------- deleting the learner's data
  const del = await g.del(`/learners/${g.learnerId}/data`);
  check(del.status === 200, "delete my data works");
  check((await CodeSnapshot.countDocuments({ learnerId: a.learnerId })) > 0 && (await a.del(`/learners/${a.learnerId}/data`)).status === 200 && (await CodeSnapshot.countDocuments({ learnerId: a.learnerId })) === 0, "deleting a learner's data removes their code snapshots");
  check((await MetricEvent.countDocuments({ who: whoHash(g.learnerId) })) === 0, "and their timing rows");
  check((await ProblemEvent.countDocuments({ learnerId: b.learnerId, kind: /^nudge/ })) > 0 && (await b.del(`/learners/${b.learnerId}/data`)).status === 200 && (await ProblemEvent.countDocuments({ learnerId: b.learnerId })) === 0, "and their nudge events");
} finally {
  for (const u of users) await u.deleteAccount().catch(() => {});
  for (const p of apis) p.kill();
  await ProblemDifficulty.deleteMany({});
  await mongoose.disconnect();
}
console.log(failures === 0 ? "\nALL BATCH-1 FLOW CHECKS PASSED" : `\n${failures} BATCH-1 FLOW CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
