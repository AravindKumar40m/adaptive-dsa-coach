// Logging v2, end to end through real accounts: grading signals, work pattern, sessions, learner events,
// the recommendation log and its variety picks, and deletion. Needs the API running on the normal port (npm run dev),
// MongoDB and Judge0. It also starts two extra API copies (ports 4103: variety always on, 4104: variety off), which
// do not touch your dev server. Test accounts end in @example.test and are removed afterwards.
// Run: npm run test:logging
import { spawn } from "node:child_process";
import mongoose from "mongoose";
import { config } from "../../src/config.js";
import { HintEvent } from "../../src/models/HintEvent.js";
import { LearnerActivity } from "../../src/models/LearnerActivity.js";
import { ProblemDifficulty } from "../../src/models/ProblemDifficulty.js";
import { ProblemEvent } from "../../src/models/ProblemEvent.js";
import { RatingUpdate } from "../../src/models/RatingUpdate.js";
import { RecommendationEvent } from "../../src/models/RecommendationEvent.js";
import { Submission } from "../../src/models/Submission.js";
import { LOGGING_VERSION, PICKER_VERSION, SCORING_VERSION } from "../../src/core/versions.js";
import { newUser } from "../lib/client.js";

const base = `http://localhost:${config.port}/api`;
let failures = 0;
const check = (ok, label, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`); };
const waitFor = async (url) => { for (let i = 0; i < 40; i++) { try { if ((await fetch(url)).status > 0) return; } catch { await new Promise((r) => setTimeout(r, 250)); } } };
const spawnApi = (port, rate) => spawn(process.execPath, ["src/index.js"], { env: { ...process.env, PORT: String(port), PICKER_EXPLORE_RATE: String(rate) }, stdio: ["ignore", "ignore", "pipe"] });

const OPT = "def peak_altitude(changes):\n    best = h = 0\n    for c in changes:\n        h += c\n        best = max(best, h)\n    return best\n";
const stub = (lang, body) => ({
  python: `def peak_altitude(changes):\n    ${body}\n`,
  javascript: `function peakAltitude(changes) {\n  ${body}\n}`,
  java: `class Solution {\n    public int peakAltitude(int[] changes) {\n        ${body}\n    }\n}`,
  cpp: `int peak_altitude(vector<int>& changes) {\n    ${body}\n}`,
})[lang];
const sortKeys = (o) => Object.fromEntries(Object.entries(o ?? {}).sort());
const body = (language, code, extra = {}) => ({ problem: "peak-altitude", language, code, ...extra });

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
const users = [];
const learner = async (b = base) => { const u = await newUser(b); users.push(u); return u; };
const rows = (u, q = {}) => Submission.find({ learnerId: u.learnerId, ...q }).sort({ createdAt: 1 }).lean();
const api3 = spawnApi(4103, 1), api4 = spawnApi(4104, 0);

try {
  // ============================================================ A. grading signals
  const a = await learner();
  const activity = { editCount: 42.6, charsInserted: 300, charsDeleted: 20, charsPasted: 1e12, pasteCount: 1, activeMs: 90000, idleMs: 30000, openToFirstEditMs: 8000, tzOffsetMin: 330, evil: "<b>", nested: { x: 1 } };
  let r = await a.post("/run", body("python", stub("python", "return changes[999]"), { activity }));
  check(r.status === 200 && r.json.verdict === "runtime_error", "setup: a Python IndexError is a runtime error", `(${r.json?.verdict})`);
  let s = (await rows(a))[0];
  check(s.errorName === "IndexError" && s.errorFamily === "index_out_of_range", "Python: error name and family are stored", `(${s.errorName} / ${s.errorFamily})`);
  check(typeof s.statusId === "number", "Judge0's own status id is stored (3 = the harness caught the exception and exited cleanly)", `(${s.statusId})`);
  check(s.exitCode === 0 && s.wallTimeSec > 0 && s.exitSignal == null, "exit code 0 and a real wall time are stored (these are only sent by Judge0 when asked for)", `(wall ${s.wallTimeSec}, exit ${s.exitCode})`);
  check(s.perTest.length === 2 && s.perTest.every((t) => t.kind === "example"), "each test result carries its kind (example/edge/random)");
  check(s.firstFailKind === "example", "the kind of the first failing test is stored");
  check(s.codeStats?.lines === 2 && s.codeStats.nonBlankLines === 2 && s.codeStats.loops === 0 && s.codeStats.chars > 20, "code statistics are stored", JSON.stringify(s.codeStats));
  check(s.approach?.closest && typeof s.approach.similarity === "number", "the closest reference approach is stored", JSON.stringify(s.approach));
  check(s.loggingVersion === LOGGING_VERSION && s.scoringVersion === SCORING_VERSION, "version tags are stored");
  check(s.sessionId?.length > 20 && s.runsOnProblemBefore === 0, "a session id is stored, and this was the 1st click on the problem");
  check(JSON.stringify(sortKeys(s.activity)) === JSON.stringify(sortKeys({ editCount: 43, charsInserted: 300, charsDeleted: 20, charsPasted: 1e6, pasteCount: 1, activeMs: 90000, idleMs: 30000, openToFirstEditMs: 8000, tzOffsetMin: 330 })), "the work pattern is stored, cleaned and clamped (junk keys dropped)", JSON.stringify(s.activity));
  check(!("loggingVersion" in r.json) && !("sessionId" in r.json) && !("codeStats" in r.json) && !("approach" in r.json), "none of these signals are sent back to the browser");

  r = await a.post("/run", body("python", stub("python", "return 0")));
  s = (await rows(a))[1];
  check(r.json.verdict === "wrong_answer" && s.errorName == null && s.errorFamily == null, "a wrong answer has no error name", `(${s.errorName}/${s.errorFamily})`);
  check(s.runsOnProblemBefore === 1 && s.activity == null, "the 2nd click knows it is the 2nd; no work pattern was sent, none is stored");

  r = await a.post("/run", body("python", "def peak_altitude(changes) return 1\n"));
  s = (await rows(a))[2];
  check(r.json.verdict === "compile_error" && s.errorFamily === "syntax", "a Python syntax error is classified as 'syntax'", `(${s.errorFamily})`);

  r = await a.post("/run", body("python", stub("python", "while True: pass")));
  s = (await rows(a))[3];
  check(r.json.verdict === "time_limit" && s.errorFamily === "timeout", "an infinite loop is classified as 'timeout'", `(${r.json.verdict}/${s.errorFamily})`);

  r = await a.post("/submit", body("python", OPT));
  s = (await rows(a))[4];
  check(r.json.verdict === "accepted" && s.firstFailKind === undefined && s.errorFamily == null, "an accepted submit has no failure signals");
  check(s.approach?.closest === "optimal" && s.approach.similarity > 0.5, "the correct solution is closest to the OPTIMAL reference", JSON.stringify(s.approach));
  check(s.codeStats.loops === 1 && s.codeStats.loopDepth === 1, "one loop, depth 1");
  check(s.perTest.length === 21 && ["example", "edge", "random"].every((k) => s.perTest.some((t) => t.kind === k)), "a submit's 21 tests carry all three kinds");
  check(s.runsOnProblemBefore === 4, "it was the 5th click on this problem");
  const ru = await RatingUpdate.findOne({ learnerId: a.learnerId }).lean();
  check(ru.scoringVersion === SCORING_VERSION && ru.sessionId === s.sessionId, "the rating change records the scoring version and the session");

  // other languages
  const crash = {
    javascript: ["return changes[0].x.y.z;", "TypeError", "type_error"],
    java: ["return changes[999];", "ArrayIndexOutOfBoundsException", "index_out_of_range"],
    cpp: ["int* p = nullptr; return *p;", null, "segfault"],
  };
  for (const [lang, [code, name, family]] of Object.entries(crash)) {
    const b = await learner();
    const res = await b.post("/run", body(lang, stub(lang, code)));
    const row = (await rows(b))[0];
    check(res.json.verdict === "runtime_error" && row.errorFamily === family && (name === null || row.errorName === name), `${lang}: crash classified as ${family}`, `(${row.errorName}/${row.errorFamily}, signal ${row.exitSignal})`);
    if (lang === "cpp") check(row.exitSignal === 11 && row.errorName === "SIGSEGV", "C++ segfault: the exit signal 11 (SIGSEGV) is stored", `(${row.exitSignal})`);
  }
  const cs = await learner();
  r = await cs.post("/run", body("java", stub("java", "return y;")));
  check(r.json.verdict === "compile_error" && (await rows(cs))[0].errorFamily === "undefined_name", "a Java 'cannot find symbol' is classified as undefined_name");

  // ============================================================ B. sessions
  const sess = (await rows(a)).map((x) => x.sessionId);
  check(new Set(sess).size === 1, "clicks close together share one session");
  await a.post("/hint", { problem: "peak-altitude" });
  const hint = await HintEvent.findOne({ learnerId: a.learnerId, kind: "ladder" }).lean();
  check(hint.sessionId === sess[0], "a hint opened in the same session carries the same session id");
  await LearnerActivity.updateOne({ learnerId: a.learnerId }, { $set: { lastAt: new Date(Date.now() - 31 * 60 * 1000) } });
  await a.post("/run", body("python", OPT));
  const later = (await rows(a)).at(-1);
  const la = await LearnerActivity.findOne({ learnerId: a.learnerId }).lean();
  check(later.sessionId !== sess[0] && la.sessionCount === 2 && la.sessionId === later.sessionId, "after a gap of more than 30 minutes a new session starts", `(sessions: ${la.sessionCount})`);

  // ============================================================ C. learner events
  const e = await learner();
  const ev = (kind, value, extra = {}) => e.post("/problem-event", { problem: "peak-altitude", kind, value, ...extra });
  check((await ev("nonsense", 1)).status === 400, "an unknown event kind is refused");
  for (const [kind, bad] of [["confidence", 6], ["confidence", 0], ["confidence", "3"], ["feel", "meh"], ["liked", "yes"], ["opened", "somewhere"], ["skipped", "boring"]]) {
    check((await ev(kind, bad)).status === 400, `${kind}=${JSON.stringify(bad)} is refused`);
  }
  check((await e.post("/problem-event", { problem: "no-such-problem", kind: "liked", value: true })).status === 404, "an unknown problem is 404");
  check((await ev("liked", true, { learnerId: "00000000-0000-0000-0000-000000000000" })).status === 403, "an event for someone else's learner id is 403");
  check((await fetch(`${base}/problem-event`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })).status === 401, "an event without a login is 401");
  const rec1 = (await e.get(`/learners/${e.learnerId}/next`)).json;
  const slug = rec1.problem.slug;
  check((await e.post("/problem-event", { problem: slug, kind: "opened", value: "rec" })).status === 201, "'opened' from a recommendation is stored");
  const opened = await ProblemEvent.findOne({ learnerId: e.learnerId, kind: "opened" }).lean();
  check(String(opened.recommendationId) === String(rec1.recommendationId) && opened.sessionId, "the open event is linked to the recommendation that offered it", `(${opened.recommendationId})`);
  for (const [kind, value] of [["confidence", 4], ["feel", "too_hard"], ["liked", true]]) check((await e.post("/problem-event", { problem: slug, kind, value })).status === 201, `${kind} is stored`);
  await e.post("/problem-event", { problem: slug, kind: "feel", value: "just_right" });
  await e.post("/problem-event", { problem: slug, kind: "liked", value: false });
  const st = (await e.get(`/learners/${e.learnerId}/problem-state/${slug}`)).json;
  check(st.confidence === 4 && st.feel === "just_right" && st.liked === false, "the page can read back the latest answers (changed answers win)", JSON.stringify(st));
  check((await e.get(`/learners/${e.learnerId}/problem-state/peak-altitude`)).json.feel === (slug === "peak-altitude" ? "just_right" : null), "answers are per problem");
  await e.post("/problem-event", { problem: slug, kind: "skipped", value: "too_hard" });
  const skipped = await ProblemEvent.findOne({ learnerId: e.learnerId, kind: "skipped" }).lean();
  check(skipped.value === "too_hard" && String(skipped.recommendationId) === String(rec1.recommendationId), "a skip stores its reason and the recommendation it refers to");
  // how a problem was reached travels onto the submission
  await e.post("/run", { problem: slug, language: "python", code: "def x():\n    pass\n" });
  const first = (await rows(e))[0];
  check(first.openSource === "rec" && String(first.recommendationId) === String(rec1.recommendationId), "a run on that problem records HOW it was reached and which recommendation offered it", `(${first.openSource})`);
  const lib = await learner();
  await lib.post("/problem-event", { problem: "peak-altitude", kind: "opened", value: "library" });
  await lib.post("/run", body("python", OPT));
  check((await rows(lib))[0].openSource === "library" && (await rows(lib))[0].recommendationId == null, "opened from the library: source stored, no recommendation");
  // flood protection
  const flood = await learner();
  let last = 0;
  for (let i = 0; i < 401; i++) last = (await flood.post("/problem-event", { problem: "peak-altitude", kind: "liked", value: true })).status;
  check(last === 429, "the 401st event within an hour is refused (flood protection)", `(${last})`);

  // ============================================================ D. the recommendation log
  const p = await learner();
  const g1 = (await p.get(`/learners/${p.learnerId}/next`)).json;
  const recs1 = await RecommendationEvent.find({ learnerId: p.learnerId }).lean();
  check(recs1.length === 1 && String(recs1[0]._id) === String(g1.recommendationId), "asking for the next problem writes one recommendation row");
  const R = recs1[0];
  check(R.pickerVersion === PICKER_VERSION && R.sessionId && R.reason && R.chosen.slug === g1.problem.slug, "it records the picker version, session, reason and the chosen problem");
  check(R.candidates.length >= 3 && R.candidates.length <= 12 && R.candidates[0].greedyRank === 1 && R.candidates.every((c) => c.expectedSuccess > 0 && c.expectedSuccess < 1), "it lists the candidates considered, with scores", `(${R.candidates.length} listed)`);
  check(R.propensity > 0 && R.propensity <= 1 && R.fitsCount > 0 && R.poolSize >= R.fitsCount && R.openCount >= R.poolSize, "it records the chance of the pick and the pool sizes", `(propensity ${R.propensity}, fits ${R.fitsCount}, pool ${R.poolSize})`);
  check(R.exploreRate === config.pickerExploreRate && R.greedySlug && typeof R.explored === "boolean", "and the variety rate, the top choice and whether this was a variety pick");
  const g2 = (await p.get(`/learners/${p.learnerId}/next`)).json;
  check(g2.reused === true && g2.problem.slug === g1.problem.slug && String(g2.recommendationId) === String(g1.recommendationId) && (await RecommendationEvent.countDocuments({ learnerId: p.learnerId })) === 1, "asking again in the same state returns the SAME pick and logs nothing new");
  const g3 = (await p.get(`/learners/${p.learnerId}/next?exclude=${g1.problem.slug}`)).json;
  check(g3.reused !== true && (await RecommendationEvent.countDocuments({ learnerId: p.learnerId })) === 2, "skipping a problem is a new state: a new decision is logged");
  await p.post("/submit", body("python", OPT)); // a Submit changes the learner's state
  const g4 = (await p.get(`/learners/${p.learnerId}/next`)).json;
  check(g4.reused !== true && (await RecommendationEvent.countDocuments({ learnerId: p.learnerId })) === 3, "a Submit is a new state: a new decision is logged");

  // variety on (rate 1) and off (rate 0), on their own API copies
  await Promise.all([waitFor("http://localhost:4103/api/health"), waitFor("http://localhost:4104/api/health")]);
  const on = await learner("http://localhost:4103/api"), off = await learner("http://localhost:4104/api");
  const picks = (u, b) => Promise.all(Array.from({ length: 12 }, (_, i) => u.get(`/learners/${u.learnerId}/next?exclude=x${i}`).then((x) => x.json)));
  const onPicks = await picks(on), offPicks = await picks(off);
  const onRows = await RecommendationEvent.find({ learnerId: on.learnerId }).lean();
  const offRows = await RecommendationEvent.find({ learnerId: off.learnerId }).lean();
  check(onRows.length === 12 && offRows.length === 12, "12 different states give 12 logged decisions on each copy");
  check(offRows.every((x) => x.explored === false && x.propensity === 1 && x.chosen.slug === x.greedySlug) && new Set(offRows.map((x) => x.chosen.slug)).size === 1, "variety off: always the top choice, propensity 1, identical every time");
  const n = onRows[0].fitsCount;
  check(onRows.some((x) => x.explored) && new Set(onRows.map((x) => x.chosen.slug)).size > 1, "variety always on: the picks differ and are flagged as variety picks", `(${onRows.filter((x) => x.explored).length} of 12 flagged, ${new Set(onRows.map((x) => x.chosen.slug)).size} different problems)`);
  check(onRows.every((x) => x.exploreRate === 1 && x.candidates.some((c) => c.slug === x.chosen.slug) && Math.abs(x.propensity - Math.round(1000 / x.fitsCount) / 1000) < 0.002), "every variety pick comes from the candidate list with propensity 1/fits", `(fits ${n}, propensity ${onRows[0].propensity})`);
  check(onPicks.every((x) => !x.done && x.problem && /./.test(x.reason)) && onPicks.some((x) => x.explored === true && /variety/i.test(x.reason)), "the learner-facing answer says 'a little variety' for variety picks and still names a real problem");

  // ============================================================ E. deletion
  check((await ProblemEvent.countDocuments({ learnerId: e.learnerId })) > 0 && (await RecommendationEvent.countDocuments({ learnerId: e.learnerId })) > 0 && (await LearnerActivity.countDocuments({ learnerId: e.learnerId })) === 1, "setup: the learner has events, recommendations and a session row");
  await e.del(`/learners/${e.learnerId}/data`);
  const left = [await ProblemEvent.countDocuments({ learnerId: e.learnerId }), await RecommendationEvent.countDocuments({ learnerId: e.learnerId }), await LearnerActivity.countDocuments({ learnerId: e.learnerId }), await Submission.countDocuments({ learnerId: e.learnerId })];
  check(left.every((x) => x === 0), "'delete my learning data' erases the new logs too", JSON.stringify(left));
  const aId = a.learnerId;
  await a.deleteAccount();
  users.splice(users.indexOf(a), 1);
  const leftA = [await ProblemEvent.countDocuments({ learnerId: aId }), await RecommendationEvent.countDocuments({ learnerId: aId }), await LearnerActivity.countDocuments({ learnerId: aId }), await HintEvent.countDocuments({ learnerId: aId }), await RatingUpdate.countDocuments({ learnerId: aId })];
  check(leftA.every((x) => x === 0), "deleting the account erases them as well", JSON.stringify(leftA));
} finally {
  for (const u of users) await u.deleteAccount().catch(() => {});
  await ProblemDifficulty.deleteMany({});
  api3.kill(); api4.kill();
  await mongoose.disconnect();
}
console.log(failures === 0 ? "\nAll Logging v2 checks passed." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
