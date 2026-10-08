// End-to-end picker test over HTTP. The API must be running (npm run dev) with MongoDB + Judge0 up.
// A simulated learner solves whatever the picker offers (using our stored optimal Python solutions) until nothing is left.
// It resets problem difficulties before and after, so use a DEV database only.   Run: npm run test:picker-flow
import mongoose from "mongoose";
import { config } from "../src/config.js";
import { Problem } from "../src/models/Problem.js";
import { ProblemDifficulty } from "../src/models/ProblemDifficulty.js";
import { ReferenceSolution } from "../src/models/ReferenceSolution.js";
import { newUser } from "./lib/client.js";

const base = `http://localhost:${config.port}/api`;
let failures = 0;
const check = (ok, label, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`); };

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
await ProblemDifficulty.deleteMany({});
const problems = await Problem.find().lean();
const total = problems.length;
const solutions = new Map((await ReferenceSolution.find({ language: "python", approach: "optimal" }).lean()).map((r) => [r.problem, r.code]));
check(solutions.size === total, `a stored optimal Python solution exists for all ${total} problems`);

// ---- 1. a learner who solves everything the picker offers
const me = await newUser(base);
const struggler = await newUser(base);
const learner = me.learnerId;
const get = async (path) => (await me.get(path)).json;
const post = async (path, body) => (await me.post(path, body)).json;
const solved = new Set();
const order = [];
const stepsLog = [];
let problemsPicked = 0;
for (let step = 0; step < total + 3; step++) {
  const skills = await get(`/learners/${learner}/skills`);
  const next = await get(`/learners/${learner}/next`);
  if (next.done) break;
  const slug = next.problem.slug;
  const concept = skills.skills.find((s) => s.concept === next.problem.concept);
  if (solved.has(slug)) check(false, `step ${step}: picker offered an already solved problem`, slug);
  if (!concept.unlocked) check(false, `step ${step}: picker offered a locked concept`, `${concept.concept} needs ${concept.missing}`);
  const r = await post("/submit", { problem: slug, language: "python", code: solutions.get(slug), startedAt: new Date(Date.now() - 60000).toISOString() });
  if (r.verdict !== "accepted") check(false, `step ${step}: reference solution was not accepted`, `${slug}: ${r.verdict}`);
  solved.add(slug);
  order.push(slug);
  problemsPicked++;
  stepsLog.push(`${String(step + 1).padStart(2)}. ${next.problem.concept.padEnd(14)} ${slug.padEnd(20)} ${next.problem.difficulty.padEnd(6)} E=${Math.round(next.expectedSuccess * 100)}% ${next.mode}`);
}
console.log(stepsLog.join("\n"));
check(new Set(order).size === order.length, "no problem was offered twice");
check(solved.size === total, `the picker eventually offered all ${total} problems`, `(${solved.size})`);
check((await get(`/learners/${learner}/next`)).done === true, "after everything is solved the picker says done");
const firstConcept = problems.find((p) => p.slug === order[0]).concept;
check(firstConcept === "arrays", "a new learner starts with arrays", `(started with ${firstConcept})`);
const conceptOf = new Map(problems.map((p) => [p.slug, p.concept]));
const firstIndex = (c) => order.findIndex((s) => conceptOf.get(s) === c);
const arraysDone2 = order.filter((s) => conceptOf.get(s) === "arrays").slice(0, 2).length === 2 ? order.findIndex((s, i) => order.slice(0, i + 1).filter((x) => conceptOf.get(x) === "arrays").length === 2) : -1;
check(firstIndex("strings") > arraysDone2 && firstIndex("hashing") > arraysDone2, "strings and hashing only appear after 2 arrays problems were solved");
check(firstIndex("sliding_window") > Math.max(firstIndex("two_pointers"), firstIndex("hashing")), "sliding_window comes after its prerequisites two_pointers and hashing");
const finalSkills = await get(`/learners/${learner}/skills`);
check(finalSkills.skills.filter((s) => s.total > 0).every((s) => s.solved === s.total && s.rating > 1000), "every concept with problems shows all solved and a rating above 1000");

// ---- 2. a learner who struggles, then skips
const sget = async (path) => (await struggler.get(path)).json;
const first = await sget(`/learners/${struggler.learnerId}/next`);
const stub = "def peak_altitude(changes):\n    pass\n";
for (let i = 0; i < 3; i++) await struggler.post("/submit", { problem: first.problem.slug, language: "python", code: stub.replace("peak_altitude", problems.find((p) => p.slug === first.problem.slug).signature.name) });
const after = await sget(`/learners/${struggler.learnerId}/next`);
const sk = await sget(`/learners/${struggler.learnerId}/skills`);
check(sk.skills.find((s) => s.concept === first.problem.concept).rating < 1000, "three failed submits lowered the rating");
check(!after.done && after.problem.slug && !sk.skills.find((s) => s.concept === "strings").unlocked, "struggler still gets a problem and nothing new unlocked");
check(after.expectedSuccess >= 0.5 - 1e-9 || after.mode === "closest", "after failing, the next problem is not harder than before", `(E ${Math.round(after.expectedSuccess * 100)}%)`);
const skipped = await sget(`/learners/${struggler.learnerId}/next?exclude=${after.problem.slug}`);
check(skipped.problem.slug !== after.problem.slug, "skipping a problem gives a different one", `(${after.problem.slug} -> ${skipped.problem.slug})`);

for (const u of [me, struggler]) await u.deleteAccount();
await ProblemDifficulty.deleteMany({});
console.log(failures === 0 ? "\nAll picker-flow checks passed." : `\n${failures} CHECK(S) FAILED`);
await mongoose.disconnect();
process.exit(failures === 0 ? 0 : 1);
