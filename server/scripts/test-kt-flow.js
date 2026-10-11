// Shadow mode end to end: the new knowledge model predicts silently beside the live Elo on each learner's first gradable Submit,
// logs both predictions, and replays exactly. Needs the API on the normal port, MongoDB and Judge0. Starts one extra API copy
// (port 4105, shadow switched off). Test accounts end in @example.test and are removed afterwards.  Run: npm run test:kt-flow
import { spawn } from "node:child_process";
import mongoose from "mongoose";
import { config } from "../src/config.js";
import { buildCatalog, createModel } from "../src/kt/index.js";
import { SHADOW_PARAMS, fromLearner, toLearner } from "../src/kt/shadow.js";
import { KnowledgeState } from "../src/models/KnowledgeState.js";
import { ModelPrediction } from "../src/models/ModelPrediction.js";
import { Problem } from "../src/models/Problem.js";
import { ProblemDifficulty } from "../src/models/ProblemDifficulty.js";
import { RatingUpdate } from "../src/models/RatingUpdate.js";
import { ReferenceSolution } from "../src/models/ReferenceSolution.js";
import { KT_VERSION } from "../src/versions.js";
import { newUser } from "./lib/client.js";

const base = `http://localhost:${config.port}/api`;
let failures = 0;
const check = (ok, label, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const waitFor = async (url) => { for (let i = 0; i < 40; i++) { try { if ((await fetch(url)).status > 0) return; } catch { await new Promise((r) => setTimeout(r, 250)); } } };

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
const solution = async (slug) => (await ReferenceSolution.findOne({ problem: slug, language: "python", approach: "optimal" }).lean()).code;
const stub = async (slug) => { const p = await Problem.findOne({ slug }).lean(); return `def ${p.signature.name}(${p.signature.params.map((x) => x.name).join(", ")}):\n    return 0\n`; };
const submit = (u, problem, code, language = "python") => u.post("/submit", { problem, language, code });
const off = spawn(process.execPath, ["src/index.js"], { env: { ...process.env, PORT: "4105", KT_SHADOW: "false" }, stdio: ["ignore", "ignore", "pipe"] });
const users = [];

try {
  await ProblemDifficulty.deleteMany({}); // known starting difficulties for the arithmetic below (dev database only)
  const u = await newUser(base); users.push(u);
  const rows = () => ModelPrediction.find({ learnerId: u.learnerId }).sort({ t: 1 }).lean();

  // ---- 1. a first correct Submit
  let r = await submit(u, "peak-altitude", await solution("peak-altitude"));
  check(r.json.verdict === "accepted", "setup: the first Submit is accepted");
  let p = await rows();
  check(p.length === 1 && p[0].y === 1 && p[0].problem === "peak-altitude", "one prediction row was logged, with the outcome");
  const E = (await RatingUpdate.findOne({ learnerId: u.learnerId }).lean()).expected;
  check(near(p[0].elo, E, 1e-9) && near(p[0].elo, 0.6400650, 1e-6), "it holds the production Elo prediction, identical to the one the rating update used", `(${p[0].elo.toFixed(6)})`);
  check(near(p[0].kt, 0.6321594, 1e-5), "and the new model's prediction, matching a hand calculation for a brand-new skill (0.632)", `(${p[0].kt.toFixed(6)})`);
  check(p[0].kt !== p[0].elo && p[0].kt > 0.5 && p[0].kt < p[0].elo, "the new model is less sure than Elo about a brand-new learner");
  check(p[0].modelVersion === KT_VERSION && p[0].params.sd0 === SHADOW_PARAMS.sd0 && near(p[0].difficulty, 900, 1e-9), "the model version, its settings and the problem difficulty used are recorded");
  check(r.json.skill.after > r.json.skill.before && !("kt" in r.json) && !JSON.stringify(r.json).includes("kt-full"), "the learner sees only the usual result: nothing from the new model leaks out");
  let st = await KnowledgeState.findOne({ learnerId: u.learnerId }).lean();
  check(st.attempts === 1 && st.skills.arrays.n === 1 && st.skills.arrays.theta > 1000 && st.skills.arrays.v < 10000, "the model's memory of the learner moved: arrays up, less uncertain", JSON.stringify(st.skills.arrays));

  // ---- 2. only the first gradable Submit counts
  await submit(u, "peak-altitude", await solution("peak-altitude"));
  check((await rows()).length === 1, "submitting an already-solved problem again logs nothing");
  r = await submit(u, "missing-number", "def find_missing(numbers) return 1\n");
  check(r.json.verdict === "compile_error" && (await rows()).length === 1, "a compile error is not a first Submit: nothing is logged");
  r = await submit(u, "missing-number", await stub("missing-number"));
  p = await rows();
  check(r.json.verdict === "wrong_answer" && p.length === 2 && p[1].y === 0 && p[1].problem === "missing-number", "the next real attempt is the first gradable Submit (a failure, y = 0)");
  await submit(u, "missing-number", await stub("missing-number"));
  check((await rows()).length === 2, "a second failed Submit on the same problem logs nothing");
  st = await KnowledgeState.findOne({ learnerId: u.learnerId }).lean();
  check(st.attempts === 2, "the model learned from exactly two outcomes", `(${st.attempts})`);

  // ---- 3. a problem with a secondary skill trains both
  r = await submit(u, "window-max-total", await stub("window-max-total"));
  st = await KnowledgeState.findOne({ learnerId: u.learnerId }).lean();
  check(st.skills.sliding_window && st.skills.stack_queue && st.skills.stack_queue.n === 1, "a two-skill problem updates both skills (sliding_window and stack_queue)", Object.keys(st.skills).join(","));
  check(st.skills.sliding_window.theta < 1000 && st.skills.sliding_window.theta < st.skills.stack_queue.theta, "the main skill moves more than the secondary one (weights 0.7 and 0.3)", `(${st.skills.sliding_window.theta.toFixed(1)} vs ${st.skills.stack_queue.theta.toFixed(1)})`);

  // ---- 4. replay: the logged predictions are exactly reproducible from the logged events
  const catalog = buildCatalog(await Problem.find().select("slug concept rating skills -_id").lean());
  const model = createModel("kt-full", SHADOW_PARAMS, catalog);
  const L = model.newLearner();
  const logged = await rows();
  let worst = 0;
  for (const row of logged) {
    model.difficultyProvider = () => row.difficulty;
    const ev = { slug: row.problem, t: row.t };
    worst = Math.max(worst, Math.abs(model.predict(L, ev) - row.kt));
    model.update(L, ev, row.y);
  }
  check(worst < 1e-9, "replaying the logged events through the model reproduces every logged prediction exactly", `(largest difference ${worst.toExponential(1)})`);
  const stored = (await KnowledgeState.findOne({ learnerId: u.learnerId }).lean()).skills;
  const replayed = fromLearner(L).skills;
  check(Object.keys(stored).sort().join() === Object.keys(replayed).sort().join() && Object.keys(stored).every((k) => near(stored[k].theta, replayed[k].theta, 1e-9) && near(stored[k].v, replayed[k].v, 1e-6)), "...and the stored memory equals the replayed memory, skill by skill (saving to the database loses nothing)");
  check(toLearner(model, { skills: stored, attempts: 3 }).skills.size === Object.keys(stored).length, "the stored memory loads back into a learner");

  // ---- 5. learners are separate
  const other = await newUser(base); users.push(other);
  await submit(other, "peak-altitude", await solution("peak-altitude"));
  const otherRows = await ModelPrediction.find({ learnerId: other.learnerId }).lean();
  check(otherRows.length === 1 && otherRows[0].kt > 0.5 && otherRows[0].kt < 0.7, "a second learner starts from a brand-new skill, unaffected by the first");
  check((await KnowledgeState.countDocuments({ learnerId: { $in: [u.learnerId, other.learnerId] } })) === 2, "each learner has their own memory row");

  // ---- 6. switched off
  await waitFor("http://localhost:4105/api/health");
  const quiet = await newUser("http://localhost:4105/api"); users.push(quiet);
  r = await quiet.post("/submit", { problem: "peak-altitude", language: "python", code: await solution("peak-altitude") });
  check(r.json.verdict === "accepted" && (await ModelPrediction.countDocuments({ learnerId: quiet.learnerId })) === 0 && (await KnowledgeState.countDocuments({ learnerId: quiet.learnerId })) === 0, "with KT_SHADOW=false nothing is logged and Submit works as usual");

  // ---- 7. deletion
  await u.del(`/learners/${u.learnerId}/data`);
  check((await ModelPrediction.countDocuments({ learnerId: u.learnerId })) === 0 && (await KnowledgeState.countDocuments({ learnerId: u.learnerId })) === 0, "'delete my learning data' erases the predictions and the model's memory");
  const oid = other.learnerId;
  await other.deleteAccount(); users.splice(users.indexOf(other), 1);
  check((await ModelPrediction.countDocuments({ learnerId: oid })) === 0 && (await KnowledgeState.countDocuments({ learnerId: oid })) === 0, "deleting the account erases them too");
} finally {
  for (const x of users) await x.deleteAccount().catch(() => {});
  await ProblemDifficulty.deleteMany({});
  off.kill();
  await mongoose.disconnect();
}
console.log(failures === 0 ? "\nAll shadow-mode checks passed." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
