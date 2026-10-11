// The owner's health and learning report. Read-only: it changes nothing.
//   npm run metrics               last 7 days
//   npm run metrics -- --days 30  a longer window
// Part 1 (technical) comes from the timing rows (metricevents, kept 14 days). Part 2 (learning and product) comes from the
// learner logs. Percentages need enough learners to mean anything: with fewer than ~20, read them as examples, not as facts.
import mongoose from "mongoose";
import { config } from "../src/config.js";
import { loadSolveHistory } from "../src/history.js";
import { MetricEvent } from "../src/models/MetricEvent.js";
import { Problem } from "../src/models/Problem.js";
import { ProblemEvent } from "../src/models/ProblemEvent.js";
import { RecommendationEvent } from "../src/models/RecommendationEvent.js";
import { Submission } from "../src/models/Submission.js";
import { User } from "../src/models/User.js";

const DAY = 86_400_000;
const argDays = process.argv.indexOf("--days");
const days = argDays > 0 ? Math.max(1, Number(process.argv[argDays + 1]) || 7) : 7;
const since = new Date(Date.now() - days * DAY);

const pct = (sorted, p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] : null);
const fmt = (x, unit = "") => (x == null ? "-" : `${Math.round(x * 10) / 10}${unit}`);
const share = (a, b) => (b > 0 ? `${Math.round((100 * a) / b)}% (${a} of ${b})` : "- (no data yet)");
const median = (xs) => pct([...xs].sort((a, b) => a - b), 0.5);
const line = (label, value) => console.log(`  ${label.padEnd(34)} ${value}`);
const head = (t) => console.log(`\n${t}\n${"-".repeat(t.length)}`);

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
console.log(`Report for the last ${days} day(s), since ${since.toISOString().slice(0, 16)}Z   (database: ${mongoose.connection.name})`);

// ---------------------------------------------------------------- 1. technical
head("1. Technical health");
const rows = await MetricEvent.find({ createdAt: { $gte: since } }).lean();
const group = (kind) => {
  const by = new Map();
  for (const r of rows.filter((x) => x.kind === kind)) { if (!by.has(r.name)) by.set(r.name, []); by.get(r.name).push(r); }
  return by;
};
const table = (by, ms = (r) => r.ms) => {
  for (const [name, rs] of [...by].sort((a, b) => b[1].length - a[1].length).slice(0, 12)) {
    const t = rs.map(ms).filter((x) => x != null).sort((a, b) => a - b);
    const fails = rs.filter((r) => !r.ok).length;
    const people = new Set(rs.filter((r) => !r.ok && r.who).map((r) => r.who)).size;
    console.log(`  ${name.padEnd(46)} n=${String(rs.length).padStart(5)}  p50 ${fmt(pct(t, 0.5), " ms").padStart(9)}  p95 ${fmt(pct(t, 0.95), " ms").padStart(9)}  failed ${fails}${fails ? ` (${people} people)` : ""}`);
  }
};
if (rows.length === 0) console.log("  No timing rows yet (they are written while the API runs, and kept 14 days).");
else {
  console.log("  API requests (slowest-used routes first; failed = server errors):");
  table(group("http"));
  console.log("\n  Code runner (Judge0), per language id; overhead = waiting minus the program's own time (queue + start-up):");
  table(group("judge0"));
  const j = rows.filter((r) => r.kind === "judge0" && r.extra?.overheadMs != null).map((r) => r.extra.overheadMs).sort((a, b) => a - b);
  if (j.length) line("Judge0 overhead (all languages)", `p50 ${fmt(pct(j, 0.5), " ms")}   p95 ${fmt(pct(j, 0.95), " ms")}`);
  console.log("\n  AI tutor calls (cache hits are not calls):");
  const ai = group("ai");
  if (ai.size === 0) console.log("  none");
  else table(ai);
  console.log("\n  MongoDB ping (once a minute while the API runs):");
  table(group("mongo"));
}

// ---------------------------------------------------------------- 2. learning and product
head("2. Learning and product");
const users = await User.find({}).select("learnerId createdAt -_id").lean();
const joined = new Map(users.map((u) => [u.learnerId, +u.createdAt]));
const submits = await Submission.find({ mode: "submit", createdAt: { $gte: since } }).select("learnerId problem verdict secondsSpent sessionId createdAt -_id").lean();
const activeIds = new Set(submits.map((s) => s.learnerId));
line("Accounts / active in this window", `${users.length} / ${activeIds.size}`);

// first Submit on each (learner, problem) over all time, to measure first-attempt success
const firstTry = new Map();
for (const s of await Submission.find({ mode: "submit" }).sort({ createdAt: 1 }).select("learnerId problem verdict -_id").lean()) {
  const k = `${s.learnerId}|${s.problem}`;
  if (!firstTry.has(k)) firstTry.set(k, s.verdict);
}
line("First-attempt success (all time)", share([...firstTry.values()].filter((v) => v === "accepted").length, firstTry.size));
const opened = new Set((await ProblemEvent.find({ kind: "opened" }).select("learnerId problem -_id").lean()).map((e) => `${e.learnerId}|${e.problem}`));
const solvedKeys = new Set((await Submission.find({ mode: "submit", verdict: "accepted" }).select("learnerId problem -_id").lean()).map((s) => `${s.learnerId}|${s.problem}`));
line("Completion: opened -> solved (all time)", share([...opened].filter((k) => solvedKeys.has(k)).length, opened.size));

// hint dependence and time, over first solves
const problems = await Problem.find({}).select("slug concept title -_id").lean();
const buckets = { "no hint": 0, "level 1": 0, "level 2": 0, "level 3+": 0 };
let firstSolves = 0;
for (const id of activeIds) {
  const seen = new Set();
  for (const s of await loadSolveHistory(id, problems)) {
    if (seen.has(s.problem)) continue;
    seen.add(s.problem); firstSolves++;
    buckets[s.hintLevel === 0 ? "no hint" : s.hintLevel === 1 ? "level 1" : s.hintLevel === 2 ? "level 2" : "level 3+"]++;
  }
}
line("Hint use on first solves", firstSolves ? Object.entries(buckets).map(([k, v]) => `${k} ${Math.round((100 * v) / firstSolves)}%`).join(", ") : "- (no data yet)");
const times = submits.filter((s) => s.verdict === "accepted" && s.secondsSpent != null).map((s) => s.secondsSpent);
line("Median time to a solved Submit", times.length ? `${fmt(median(times) / 60, " min")} (n=${times.length})` : "- (no data yet)");

// retention: did the learner come back on day N after signing up? (calendar window [N, N+1) days after sign-up)
const allSubmits = await Submission.find({}).select("learnerId createdAt -_id").lean();
const retained = (n) => {
  const eligible = [...joined].filter(([, t]) => Date.now() - t >= (n + 1) * DAY);
  const back = eligible.filter(([id, t]) => allSubmits.some((s) => s.learnerId === id && +s.createdAt >= t + n * DAY && +s.createdAt < t + (n + 1) * DAY));
  return share(back.length, eligible.length);
};
line("Day-1 retention", retained(1));
line("Day-7 retention", retained(7));
const solvedPerDay = new Map();
for (const s of submits.filter((x) => x.verdict === "accepted")) { const k = `${s.learnerId}|${new Date(s.createdAt).toISOString().slice(0, 10)}`; solvedPerDay.set(k, (solvedPerDay.get(k) ?? 0) + 1); }
line("Solved Submits per active learner-day", solvedPerDay.size ? fmt([...solvedPerDay.values()].reduce((a, b) => a + b, 0) / solvedPerDay.size) : "- (no data yet)");
const sessionsBy = new Map();
for (const s of submits) { if (!sessionsBy.has(s.learnerId)) sessionsBy.set(s.learnerId, new Set()); if (s.sessionId) sessionsBy.get(s.learnerId).add(s.sessionId); }
line("Sessions per active learner per week", sessionsBy.size ? fmt(([...sessionsBy.values()].reduce((a, s) => a + s.size, 0) / sessionsBy.size) * (7 / days)) : "- (no data yet)");

// ---------------------------------------------------------------- 3. the new Batch-1 features
head("3. Reviews and nudges (this window)");
const recs = await RecommendationEvent.find({ createdAt: { $gte: since }, mode: "review" }).select("learnerId chosen.slug createdAt -_id").lean();
let reviewDone = 0;
for (const r of recs) if (await Submission.exists({ learnerId: r.learnerId, problem: r.chosen?.slug, mode: "submit", verdict: "accepted", createdAt: { $gte: r.createdAt } })) reviewDone++;
line("Reviews offered / solved afterwards", `${recs.length} / ${reviewDone}`);
const nudges = await ProblemEvent.aggregate([{ $match: { createdAt: { $gte: since }, kind: { $in: ["nudge_shown", "nudge_taken", "nudge_dismissed"] } } }, { $group: { _id: "$kind", n: { $sum: 1 } } }]);
const n = Object.fromEntries(nudges.map((x) => [x._id, x.n]));
line("Nudges shown / opened hints / dismissed", `${n.nudge_shown ?? 0} / ${n.nudge_taken ?? 0} / ${n.nudge_dismissed ?? 0}`);

console.log("\n(Learning gain per hour of learner time is Batch 2.)");
await mongoose.disconnect();
