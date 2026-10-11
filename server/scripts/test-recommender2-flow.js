// Recommender v2 and the placement survey, end to end through real accounts. Needs the API on the normal port, MongoDB and Judge0.
// Starts three extra API copies (ports 4106: PICKER_POLICY=v2, 4107: ab, 4108: v2 with shadow mode off); your dev server is not touched.
// Test accounts end in @example.test and are removed afterwards.  Run: npm run test:recommender2-flow
import { spawn } from "node:child_process";
import mongoose from "mongoose";
import { config } from "../src/config.js";
import { SHADOW_PARAMS } from "../src/kt/shadow.js";
import { KnowledgeState } from "../src/models/KnowledgeState.js";
import { PlacementSurvey } from "../src/models/PlacementSurvey.js";
import { ProblemDifficulty } from "../src/models/ProblemDifficulty.js";
import { RecommendationEvent } from "../src/models/RecommendationEvent.js";
import { ReferenceSolution } from "../src/models/ReferenceSolution.js";
import { policyFor } from "../src/policy.js";
import { RECOMMENDER2_VERSION } from "../src/versions.js";
import { newUser } from "./lib/client.js";

let failures = 0;
const check = (ok, label, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const waitFor = async (url) => { for (let i = 0; i < 40; i++) { try { if ((await fetch(url)).status > 0) return; } catch { await new Promise((r) => setTimeout(r, 250)); } } };
const spawnApi = (port, env) => spawn(process.execPath, ["src/index.js"], { env: { ...process.env, PORT: String(port), ...env }, stdio: ["ignore", "ignore", "pipe"] });
const solution = async (slug) => (await ReferenceSolution.findOne({ problem: slug, language: "python", approach: "optimal" }).lean()).code;

// ---------------------------------------------------------------- the switch (no servers needed)
check(policyFor("anyone", { policy: "v1", shadow: true }) === "v1", "default policy v1: everybody gets today's picker");
check(policyFor("anyone", { policy: "v2", shadow: true }) === "v2" && policyFor("anyone", { policy: "v2", shadow: false }) === "v1", "v2 needs shadow mode (the model's memory); without it everybody gets v1");
const ids = Array.from({ length: 400 }, (_, i) => `learner-${i}-abcdef`);
const split = ids.map((id) => policyFor(id, { policy: "ab", shadow: true }));
const v2share = split.filter((p) => p === "v2").length / ids.length;
check(v2share > 0.4 && v2share < 0.6, "ab splits learners roughly half and half", `(${Math.round(v2share * 100)}% get v2)`);
check(ids.every((id, i) => policyFor(id, { policy: "ab", shadow: true }) === split[i]), "the split depends only on the learner id: always the same answer for the same person");

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
const apis = [spawnApi(4106, { PICKER_POLICY: "v2" }), spawnApi(4107, { PICKER_POLICY: "ab" }), spawnApi(4108, { PICKER_POLICY: "v2", KT_SHADOW: "false" })];
const users = [];
const learner = async (port) => { const u = await newUser(`http://localhost:${port}/api`); users.push(u); return u; };
const next = (u, q = "") => u.get(`/learners/${u.learnerId}/next${q}`).then((r) => r.json);

try {
  await ProblemDifficulty.deleteMany({});
  await Promise.all([4106, 4107, 4108].map((p) => waitFor(`http://localhost:${p}/api/health`)));

  // ---------------------------------------------------------------- v2 recommendations
  const a = await learner(4106);
  const r1 = await next(a);
  check(r1.policy === "v2" && r1.mode === "v2" && r1.slot === "warmup" && r1.recommendationId, "a new learner on v2 starts with a warm-up", `(${r1.problem?.slug}, ${Math.round(r1.expectedSuccess * 100)}%)`);
  check(/\d+%/.test(r1.reason) && r1.reason.length > 30, "and gets a plain-words reason", `"${r1.reason}"`);
  check(r1.expectedSuccess > 0.5 && r1.expectedSuccess < 0.95, "the offered problem has a sensible chance of success");
  const row = await RecommendationEvent.findById(r1.recommendationId).lean();
  check(row.policy === "v2" && row.pickerVersion === RECOMMENDER2_VERSION && row.v2.slot === "warmup" && row.v2.warmup === true && row.mode === "v2", "the log row records the policy, version, slot and that it was the warm-up phase");
  check(row.candidates.length >= 3 && row.candidates.every((c) => typeof c.score === "number" && c.parts && "fit" in c.parts && "info" in c.parts && "review" in c.parts) && row.candidates[0].greedyRank === 1, "it lists the candidates with their scores and the five parts", `(${row.candidates.length} listed)`);
  check(row.propensity > 0 && row.propensity <= 1 && row.greedySlug && typeof row.explored === "boolean" && row.exploreRate == null, "and the probability of the pick (a softmax weight), what the top choice was, and whether this was it");
  const again = await next(a);
  check(again.reused === true && again.problem.slug === r1.problem.slug && (await RecommendationEvent.countDocuments({ learnerId: a.learnerId })) === 1, "asking again in the same state gives the same pick and logs nothing new");

  // the session arc advances with each Submit, and solved problems are never offered again
  await a.post("/submit", { problem: r1.problem.slug, language: "python", code: await solution(r1.problem.slug) });
  const r2 = await next(a);
  check(r2.slot === "core" && r2.problem.slug !== r1.problem.slug, "after one Submit the slot is 'core' and a different problem is offered");
  await a.post("/submit", { problem: r2.problem.slug, language: "python", code: await solution(r2.problem.slug) });
  const r3 = await next(a);
  await a.post("/submit", { problem: r3.problem.slug, language: "python", code: await solution(r3.problem.slug) });
  const r4 = await next(a);
  check(r3.slot === "core" && r4.slot === "stretch", "the third Submit leads to a 'stretch' problem", `(${r2.slot}, ${r3.slot}, ${r4.slot})`);
  const solvedNow = [r1, r2, r3].map((r) => r.problem.slug);
  const row4 = await RecommendationEvent.findById(r4.recommendationId).lean();
  check(!row4.candidates.some((c) => solvedNow.includes(c.slug)), "solved problems are not among the candidates");
  check(row4.candidates.every((c) => ["arrays", "strings", "hashing", "two_pointers", "sorting", "stack_queue", "linked_list", "recursion"].includes(c.concept)), "only unlocked topics are offered (the curriculum rules still hold)", [...new Set(row4.candidates.map((c) => c.concept))].join(","));
  const ks = await KnowledgeState.findOne({ learnerId: a.learnerId }).lean();
  check(ks.attempts === 3 && ks.recent.length === 3, "the knowledge model's memory (and its last results) is kept up to date by the Submits");

  // ---------------------------------------------------------------- the A/B copy and the shadow-off copy
  const abUsers = [];
  for (let i = 0; i < 10; i++) abUsers.push(await learner(4107));
  const got = [];
  for (const u of abUsers) got.push((await next(u)).policy);
  check(abUsers.every((u, i) => got[i] === policyFor(u.learnerId, { policy: "ab", shadow: true })), "on the A/B copy every learner gets exactly the policy their id decides");
  check(got.includes("v1") && got.includes("v2"), "and both recommenders are in use", `(${got.filter((p) => p === "v2").length} of 10 on v2)`);
  const v1Row = await RecommendationEvent.findOne({ learnerId: abUsers[got.indexOf("v1")].learnerId }).lean();
  check(v1Row.policy === "v1" && v1Row.pickerVersion !== RECOMMENDER2_VERSION && v1Row.v2 == null, "a v1 learner's log row says v1 and has no v2 details");
  const noShadow = await learner(4108);
  const ns = await next(noShadow);
  check(ns.policy === "v1" && ns.slot === null, "with shadow mode off, a server set to v2 quietly falls back to v1");

  // ---------------------------------------------------------------- the placement self-assessment
  const s = await learner(4106);
  const post = (body) => s.post("/placement", body);
  check((await post({ answers: {} })).status === 400, "an empty survey is refused");
  check((await post({ answers: { nonsense: 3 } })).status === 400, "an unknown topic is refused");
  check((await post({ answers: { arrays: 7 } })).status === 400 && (await post({ answers: { arrays: 2.5 } })).status === 400 && (await post({ answers: { arrays: "3" } })).status === 400, "answers must be whole numbers from 0 to 4");
  check((await post({ answers: { arrays: 2 }, experience: 9 })).status === 400, "experience must be 0 to 3");
  check((await post({ answers: { arrays: 2 }, learnerId: "00000000-0000-0000-0000-000000000000" })).status === 403, "a survey for someone else's id is 403");
  check((await fetch(`http://localhost:4106/api/placement`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })).status === 401, "a survey without a login is 401");
  check((await s.get(`/learners/${s.learnerId}/placement`)).json.done === false, "before filling it in, the survey reads as not done");
  const ok = await post({ answers: { arrays: 4, strings: 0, dp: 2, hashing: 3 }, experience: 2 });
  check(ok.status === 201 && ok.json.priorsSet.sort().join() === "arrays,dp,hashing,strings", "a valid survey is saved");
  const state = (await KnowledgeState.findOne({ learnerId: s.learnerId }).lean()).skills;
  check(state.arrays.theta === 1060 && state.strings.theta === 940 && state.dp.theta === 1000 && state.hashing.theta === 1030, "it becomes a weak starting guess: 1000 + 30 x (answer - 2) per topic", JSON.stringify(Object.fromEntries(Object.entries(state).map(([k, v]) => [k, v.theta]))));
  check(state.arrays.v === SHADOW_PARAMS.sd0 ** 2 && state.arrays.n === 0 && state.arrays.last === null, "with the normal uncertainty, no attempts, and no 'last practised' time (so it cannot fade)");
  const g = (await s.get(`/learners/${s.learnerId}/placement`)).json;
  check(g.done === true && g.answers.arrays === 4 && g.experience === 2, "and can be read back");
  // the guess changes what the model expects of this learner
  const strong = await learner(4106), weak = await learner(4106);
  await strong.post("/placement", { answers: { arrays: 4, strings: 4, hashing: 4 } });
  await weak.post("/placement", { answers: { arrays: 0, strings: 0, hashing: 0 } });
  const [rs, rw] = [await next(strong), await next(weak)];
  const [cs, cw] = [await RecommendationEvent.findById(rs.recommendationId).lean(), await RecommendationEvent.findById(rw.recommendationId).lean()];
  const same = cs.candidates.find((c) => cw.candidates.some((d) => d.slug === c.slug));
  const sameW = cw.candidates.find((c) => c.slug === same.slug);
  check(same.expectedSuccess > sameW.expectedSuccess, "the same problem looks easier for the learner who rated themselves higher", `(${same.slug}: ${same.expectedSuccess} vs ${sameW.expectedSuccess})`);
  const diff = same.expectedSuccess - sameW.expectedSuccess;
  check(diff > 0.02 && diff < 0.2, "but only a little: a self-assessment is a weak guess", `(difference ${diff.toFixed(3)})`);
  // real attempts beat the self-assessment, and redoing the survey never overwrites them
  await strong.post("/submit", { problem: rs.problem.slug, language: "python", code: "def x():\n    pass\n" });
  const concept = rs.problem.concept;
  const after = (await KnowledgeState.findOne({ learnerId: strong.learnerId }).lean()).skills[concept];
  await strong.post("/placement", { answers: { [concept]: 0 } });
  const redone = (await KnowledgeState.findOne({ learnerId: strong.learnerId }).lean()).skills[concept];
  check(after.n >= 1 && redone.theta === after.theta && redone.n === after.n, "once a skill has real attempts, redoing the survey does not overwrite it");
  await s.post("/placement", { answers: { arrays: 0 } });
  check((await KnowledgeState.findOne({ learnerId: s.learnerId }).lean()).skills.arrays.theta === 940, "but for an unpractised skill, redoing the survey replaces the guess");

  // ---------------------------------------------------------------- deletion
  await s.del(`/learners/${s.learnerId}/data`);
  check((await PlacementSurvey.countDocuments({ learnerId: s.learnerId })) === 0 && (await KnowledgeState.countDocuments({ learnerId: s.learnerId })) === 0, "'delete my learning data' erases the survey and the guess");
  const aid = a.learnerId;
  await a.deleteAccount(); users.splice(users.indexOf(a), 1);
  check((await RecommendationEvent.countDocuments({ learnerId: aid })) === 0, "deleting the account erases the recommendation log too");
} finally {
  for (const u of users) await u.deleteAccount().catch(() => {});
  await ProblemDifficulty.deleteMany({});
  apis.forEach((p) => p.kill());
  await mongoose.disconnect();
}
console.log(failures === 0 ? "\nAll recommender-v2 flow checks passed." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
