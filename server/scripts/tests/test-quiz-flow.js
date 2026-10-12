// The placement quiz end to end through real accounts: what the browser may see, validation, resuming, a strong learner,
// a beginner, stopping early, real attempts beating the quiz, a double click, the effect on the picker and on the skill map,
// and deletion. Needs MongoDB and Judge0 (one solve). Starts its own API copy on port 4113; your dev server is not touched.
// Test accounts end in @example.test and are removed afterwards.   Run: npm run test:quiz-flow
import { spawn } from "node:child_process";
import mongoose from "mongoose";
import { config } from "../../src/config.js";
import { KnowledgeState } from "../../src/models/KnowledgeState.js";
import { PlacementItem } from "../../src/models/PlacementItem.js";
import { PlacementQuiz } from "../../src/models/PlacementQuiz.js";
import { ProblemDifficulty } from "../../src/models/ProblemDifficulty.js";
import { ReferenceSolution } from "../../src/models/ReferenceSolution.js";
import { SkillRating } from "../../src/models/SkillRating.js";
import { newUser } from "../lib/client.js";

let failures = 0;
const check = (ok, label, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (url) => { for (let i = 0; i < 40; i++) { try { if ((await fetch(url)).status > 0) return; } catch { await sleep(250); } } };

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
const bank = new Map((await PlacementItem.find().lean()).map((i) => [i.id, i]));
const api = spawn(process.execPath, ["src/index.js"], { env: { ...process.env, PORT: "4113", PICKER_EXPLORE_RATE: "0" }, stdio: ["ignore", "ignore", "pipe"] });
const base = "http://localhost:4113/api";
const users = [];
const learner = async () => { const u = await newUser(base); users.push(u); return u; };

/** The wrong option (not the answer, not "I don't know") and the right one, in the original numbering the browser sends back. */
const right = (id) => bank.get(id).answer;
const wrong = (id) => [0, 1, 2, 3].find((i) => i !== bank.get(id).answer);
/** Plays a quiz: policy(itemId) -> choice. Stops when the server says done, or after `max` answers. Returns every question seen and the last response. */
async function play(u, policy, { max = 99, restart = false } = {}) {
  let r = await u.post("/quiz/start", { restart });
  const seen = [];
  let q = r.json.question, quizId = r.json.quizId;
  let last = r;
  while (q && seen.length < max) {
    seen.push(q);
    last = await u.post("/quiz/answer", { quizId, item: q.id, choice: policy(q.id), ms: 4000 });
    if (last.json.done) return { seen, quizId, last, results: last.json.results };
    q = last.json.question;
  }
  return { seen, quizId, last, results: null };
}
const skills = (u) => u.get(`/learners/${u.learnerId}/skills`).then((r) => Object.fromEntries(r.json.skills.map((s) => [s.concept, s])));

try {
  await ProblemDifficulty.deleteMany({});
  await waitFor(`${base}/health`);

  // ---------------------------------------------------------------- access and what the browser may see
  const a = await learner();
  check((await fetch(`${base}/quiz/status`)).status === 401 && (await fetch(`${base}/quiz/start`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })).status === 401, "without a login the quiz routes answer 401");
  let r = await a.get("/quiz/status");
  check(r.status === 200 && r.json.available === true && r.json.inProgress === null && r.json.last === null, "a new learner: the quiz is available, nothing in progress, nothing finished");
  r = await a.post("/quiz/start", {});
  const first = r.json;
  check(r.status === 201 && first.question.id === "arrays-L2" && first.progress.answered === 0 && first.progress.max === 24 && first.progress.canStop === false, "start: the first question is the medium arrays question, 0 of up to 24 answered, cannot stop yet", JSON.stringify(first.progress));
  const text = JSON.stringify(first);
  check(!/"answer"|"explain"|correct/i.test(text), "the question carries no answer, no explanation and no 'correct' flag");
  check(first.question.options.length === 4 && [...first.question.options.map((o) => o.id)].sort().join() === "0,1,2,3" && first.question.kind === "trace" && first.question.code?.includes("append"), "four options with ids 0-3 and the code to trace");
  const again = (await a.post("/quiz/start", {})).json;
  check(again.quizId === first.quizId && JSON.stringify(again.question.options) === JSON.stringify(first.question.options) && again.resumed === false, "starting again before answering reuses the same quiz and the same option order");

  // ---------------------------------------------------------------- validation
  const qid = first.quizId;
  check((await a.post("/quiz/answer", { quizId: "nope", item: "arrays-L2", choice: 0 })).status === 400, "a malformed quiz id: 400");
  check((await a.post("/quiz/answer", { quizId: qid, item: "arrays-L2", choice: 7 })).status === 400 && (await a.post("/quiz/answer", { quizId: qid, item: "arrays-L2", choice: "A" })).status === 400 && (await a.post("/quiz/answer", { quizId: qid, item: "arrays-L2", choice: -2 })).status === 400, "choice 7, 'A' and -2 are refused");
  r = await a.post("/quiz/answer", { quizId: qid, item: "dp-L3", choice: 0 });
  check(r.status === 409 && r.json.question.id === "arrays-L2", "answering a question that is not the current one: 409, and the real current question comes back");
  const b = await learner();
  check((await b.post("/quiz/answer", { quizId: qid, item: "arrays-L2", choice: 0 })).status === 404, "someone else's quiz id: 404");
  check((await b.post("/quiz/finish", { quizId: qid })).status === 404, "and they cannot finish it either");
  check((await a.post("/quiz/finish", { quizId: qid })).status === 400, "stopping before 6 answers: 400");
  check((await a.get("/quiz/results")).status === 404, "no results before a quiz is finished");

  // ---------------------------------------------------------------- a double click records the answer once
  const [d1, d2] = await Promise.all([a.post("/quiz/answer", { quizId: qid, item: "arrays-L2", choice: right("arrays-L2") }), a.post("/quiz/answer", { quizId: qid, item: "arrays-L2", choice: right("arrays-L2") })]);
  check([d1.status, d2.status].sort().join() === "200,409" && (await PlacementQuiz.findById(qid).lean()).answers.length === 1, "two identical answers at once: one is recorded, the other gets 409");

  // ---------------------------------------------------------------- resume and restart
  const q2 = d1.status === 200 ? d1.json.question : d2.json.question;
  for (const id of [q2.id]) await a.post("/quiz/answer", { quizId: qid, item: id, choice: right(id) });
  r = await a.get("/quiz/status");
  check(r.json.inProgress?.answered === 2, "the status shows a quiz in progress with 2 answers");
  r = await a.post("/quiz/start", {});
  check(r.json.resumed === true && r.json.quizId === qid && r.json.progress.answered === 2, "starting again resumes it at question 3");
  r = await a.post("/quiz/start", { restart: true });
  check(r.json.resumed === false && r.json.quizId !== qid && r.json.progress.answered === 0 && (await PlacementQuiz.findById(qid).lean()).status === "abandoned", "'start again' abandons the old quiz and begins a new one");

  // ---------------------------------------------------------------- a strong learner
  const s = await learner();
  const strong = await play(s, right);
  check(strong.seen.length === 24 && strong.results && strong.last.json.done === true, "a learner who answers everything right is asked 24 questions, then gets the results");
  check(strong.seen.slice(0, 16).every((q) => q.id.endsWith("-L2")) && strong.seen.slice(16).every((q) => q.id.endsWith("-L3")), "16 medium questions first, then 8 hard ones");
  check(strong.seen.every((q) => q.kind === "trace" && q.code), "a strong learner sees code-tracing questions only (the concept questions are the easy level, asked after a miss)");
  const sr = strong.results;
  check(sr.answered === 24 && sr.correct === 24 && sr.topics.length === 16 && sr.placed.length === 8 && sr.stoppedEarly === false, "results: 24 of 24, 16 topics estimated, 8 placed out", JSON.stringify(sr.placed.map((p) => p.concept)));
  check(sr.review.length === 24 && sr.review.every((x) => x.right && x.correctAnswer && x.explain.length > 20), "the results include all 24 questions with the right answer and an explanation");
  check(sr.topics.find((t) => t.concept === "arrays").rating === 1200 && sr.topics.find((t) => t.concept === "dp").rating === 1080, "arrays starts at 1200 (hard answered), dp at 1080 (one medium answer)");
  const sk = await skills(s);
  check(sk.arrays.rating === 1200 && sk.arrays.attempts === 0 && sk.arrays.solved === 0 && sk.dp.rating === 1080, "the skill map shows those ratings, with 0 attempts and nothing solved");
  check(sk.strings.unlocked && sk.sliding_window.unlocked && sk.binary_search.unlocked && sk.greedy.unlocked && !sk.trees.unlocked && !sk.dp.unlocked && !sk.heaps.unlocked, "placed topics open what depends on them (strings, sliding window, binary search, greedy) while trees, heaps and dp stay locked");
  check((await SkillRating.findOne({ learnerId: s.learnerId, concept: "arrays" }).lean()).source === "placement", "the rating row says it came from the placement quiz");
  const ks = await KnowledgeState.findOne({ learnerId: s.learnerId }).lean();
  check(ks.skills.arrays.theta === 1200 && ks.skills.arrays.n === 0, "the knowledge model got the same starting guess (1200, no attempts)");
  const next = (await s.get(`/learners/${s.learnerId}/next`)).json;
  check(["recursion", "binary_search", "greedy"].includes(next.problem.concept) && next.mode === "weakest", "the first recommendation skips the warm-up: the weakest OPEN topic (1080), not arrays", `(${next.problem.concept}: ${next.problem.slug})`);
  const fresh = await learner();
  check((await fresh.get(`/learners/${fresh.learnerId}/next`)).json.problem.concept === "arrays", "a learner without the quiz still starts with arrays");
  // the regression the real browser found: a recommendation made BEFORE the quiz must not be reused AFTER it
  const early2 = await learner();
  const beforeQuiz = (await early2.get(`/learners/${early2.learnerId}/next`)).json;
  await play(early2, right);
  const afterQuiz = (await early2.get(`/learners/${early2.learnerId}/next`)).json;
  check(beforeQuiz.problem.concept === "arrays" && afterQuiz.reused !== true && afterQuiz.problem.concept !== "arrays" && afterQuiz.recommendationId !== beforeQuiz.recommendationId, "a recommendation made before the quiz is NOT reused after it (the page showed arrays again until this was fixed)", `(${beforeQuiz.problem.concept} -> ${afterQuiz.problem.concept})`);
  r = await s.get("/quiz/results");
  check(r.status === 200 && r.json.review.length === 24, "the last result can be fetched again");
  r = await s.get("/quiz/status");
  check(r.json.last.placed === 8 && r.json.last.correct === 24 && r.json.inProgress === null, "the status now shows the finished quiz");
  const stored = await PlacementQuiz.findOne({ learnerId: s.learnerId, status: "finished" }).lean();
  check(stored.answers.length === 24 && stored.answers.every((x) => x.ms === 4000 && x.order.length === 4 && x.correct === true && x.chosen >= 0) && stored.algorithmVersion === "placement-1" && stored.bankVersion === "placement-bank-1", "the stored quiz has every answer with its time, option order and correctness, and both version tags");

  // ---------------------------------------------------------------- a beginner (one wrong answer, one 'I don't know')
  const beg = await learner();
  const bres = await play(beg, (id) => (id === "arrays-L2" ? wrong(id) : -1));
  check(bres.seen.map((q) => q.id).join() === "arrays-L2,arrays-L1" && bres.results.placed.length === 0, "a beginner gets only arrays medium and arrays easy, then the results");
  check(bres.seen[1].kind === "mcq" && bres.seen[1].code === null && bres.seen[1].options.length === 4, "the easy question is a concept question without code");
  check(bres.results.topics.length === 1 && bres.results.topics[0].rating === 850 && bres.results.review[1].yourAnswer === null && bres.results.review[1].right === false, "arrays starts at 850, and 'I don't know' counts as not right");
  check((await skills(beg)).arrays.rating === 850 && (await skills(beg)).strings.rating === 1000 && !(await skills(beg)).strings.unlocked, "other topics stay at 1000 and locked");

  // ---------------------------------------------------------------- stopping early
  const early = await learner();
  const e5 = await play(early, right, { max: 5 });
  check(e5.seen.length === 5 && e5.results === null, "(setup) five answers given");
  check((await early.post("/quiz/finish", { quizId: e5.quizId })).status === 400, "stopping after 5 answers: 400");
  const q6 = (await early.get("/quiz/status")).json;
  const cont = await early.post("/quiz/start", {});
  await early.post("/quiz/answer", { quizId: cont.json.quizId, item: cont.json.question.id, choice: right(cont.json.question.id) });
  r = await early.post("/quiz/finish", { quizId: cont.json.quizId });
  check(q6.inProgress.answered === 5 && r.status === 200 && r.json.results.stoppedEarly === true && r.json.results.topics.length === 6 && r.json.results.placed.length === 0, "after 6 answers 'stop' works: 6 topics estimated, none placed out (one answer each)");

  // ---------------------------------------------------------------- real attempts beat the quiz
  const real = await learner();
  const solution = (await ReferenceSolution.findOne({ problem: "peak-altitude", language: "python", approach: "optimal" }).lean()).code;
  const solved = (await real.post("/submit", { problem: "peak-altitude", language: "python", code: solution, startedAt: new Date(Date.now() - 30000).toISOString() })).json;
  const before = (await SkillRating.findOne({ learnerId: real.learnerId, concept: "arrays" }).lean()).rating;
  const rres = await play(real, right);
  const after = (await SkillRating.findOne({ learnerId: real.learnerId, concept: "arrays" }).lean());
  check(solved.verdict === "accepted" && after.rating === before && after.attempts === 1 && !after.source, "a topic with real attempts keeps its real rating (the quiz did not overwrite it)", `(${before} -> ${after.rating})`);
  check(rres.results.kept.some((k) => k.concept === "arrays") && !rres.results.topics.find((t) => t.concept === "arrays").applied && rres.results.topics.find((t) => t.concept === "strings").applied, "the results say arrays was kept and strings was set from the quiz");
  check((await skills(real)).strings.rating === 1200, "strings starts at 1200 from the quiz");

  // ---------------------------------------------------------------- retaking changes only unpractised topics
  const retake = await play(s, () => -1, { restart: true });
  const s2 = await skills(s);
  check(retake.results.topics.length === 1 && s2.arrays.rating === 850 && s2.strings.rating === 1200, "retaking as a beginner lowers arrays (no real attempts there) and leaves the other topics as they were");

  // ---------------------------------------------------------------- deletion
  const del = await s.del(`/learners/${s.learnerId}/data`);
  check(del.status === 200 && (await PlacementQuiz.countDocuments({ learnerId: s.learnerId })) === 0 && (await SkillRating.countDocuments({ learnerId: s.learnerId })) === 0, "delete my data removes the quizzes and the ratings the quiz set");
  check((await s.get("/quiz/status")).json.last === null && (await skills(s)).arrays.rating === 1000 && !(await skills(s)).strings.unlocked, "afterwards the quiz is gone, ratings are back to 1000 and strings is locked again");
} finally {
  for (const u of users) await u.deleteAccount().catch(() => {});
  api.kill();
  await ProblemDifficulty.deleteMany({});
  await mongoose.disconnect();
}
console.log(failures === 0 ? "\nALL QUIZ-FLOW CHECKS PASSED" : `\n${failures} QUIZ-FLOW CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
