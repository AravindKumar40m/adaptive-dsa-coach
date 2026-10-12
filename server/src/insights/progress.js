// The learner's progress report: skills, strongest and weakest topic, mistakes, how much help they needed, which topics
// are due for review, and their pace. Pure: it only reshapes data that is already logged (no new recording).
// The database side is loadProgress.js; the HTTP side is routes/skills.js (GET /learners/:id/progress).
import { reviewStates } from "../recommend/review.js";
import { conceptStatus } from "../recommend/picker.js";
import { START_RATING, expectedScore } from "../skill/skill.js";
import { learningGain } from "./gain.js";

const DAY = 86_400_000;
export const TYPICAL_DIFFICULTY = 1200; // the seed rating of a medium problem: "chance to solve a typical medium problem"
const round1 = (x) => Math.round(x * 10) / 10;

// error family (grading/errors.js) -> words a learner understands
export const MISTAKE_LABELS = {
  wrong_answer: "Wrong answer (the code ran, but gave a different result)",
  index_out_of_range: "Index out of range (reading past the end of a list)",
  null_reference: "Using an empty value (null)",
  attribute_or_null: "Using an empty value (None or null)",
  type_error: "Wrong type of value",
  type_mismatch: "Types that do not match",
  missing_key: "Looking up a key that is not there",
  zero_division: "Dividing by zero",
  recursion_depth: "Recursion that goes too deep",
  syntax: "Syntax error",
  compile_error: "Compile error",
  compile_other: "Compile error",
  undefined_name: "Using a name that was never defined",
  time_limit: "Too slow (ran out of time)",
  timeout: "Too slow (ran out of time)",
  memory: "Used too much memory",
  segfault: "Crash from a bad memory access",
  value_error: "A value the code could not handle",
  range_error: "A number outside the allowed range",
  output_too_large: "Printed far too much",
  wrong_return_type: "Returned the wrong kind of value",
  missing_return: "Forgot to return a value",
  cycle_in_result: "The returned list or tree loops back on itself",
};
const labelOf = (key) => MISTAKE_LABELS[key] ?? "Another kind of crash";

/**
 * @param {object} d
 *  concepts, problems, ratings:Map, attempts:Map, solved:Set  (learnerState)
 *  solves: [{concept, problem, title, at, fails, hintLevel}]  (history.js; every accepted Submit, oldest first)
 *  submissions: [{problem, mode, verdict, errorFamily, at}]   (every Run/Submit)
 *  updates: [{at, before, after}]                              (rating changes)
 *  times: number[]                                             (every logged event time, for engaged time)
 *  now: number
 */
export function buildProgress({ concepts, problems, ratings, attempts, solved, placed = new Set(), solves, submissions, updates, times, complexity = [], now }) {
  // ---- skills
  const status = conceptStatus({ concepts, problems, solved, placed });
  const skills = concepts.filter((c) => (status.get(c.key)?.total ?? 0) > 0).map((c) => {
    const s = status.get(c.key);
    const rating = ratings.get(c.key) ?? START_RATING;
    return {
      concept: c.key, name: c.name, rating: Math.round(rating), attempts: attempts.get(c.key) ?? 0,
      solved: s.solved, total: s.total, unlocked: s.unlocked, missing: s.missing,
      chance: Math.round(expectedScore(rating, TYPICAL_DIFFICULTY) * 100), // % chance to solve a typical medium problem
    };
  });
  // strongest / weakest only mean something when at least two topics were practised and they differ
  const practised = skills.filter((s) => s.attempts > 0);
  const best = practised.length >= 2 ? practised.reduce((a, b) => (b.rating > a.rating ? b : a)) : null;
  const weakPool = practised.filter((s) => s.unlocked);
  const worst = weakPool.length >= 2 ? weakPool.reduce((a, b) => (b.rating < a.rating ? b : a)) : null;
  const pick = (s) => (s ? { concept: s.concept, name: s.name, rating: s.rating } : null);

  // ---- mistakes: every failed Run or Submit, by what went wrong
  const failed = submissions.filter((s) => s.verdict && s.verdict !== "accepted" && s.verdict !== "internal_error");
  const byKey = new Map();
  for (const s of failed) {
    const key = s.errorFamily ?? (s.verdict === "wrong_answer" ? "wrong_answer" : s.verdict);
    byKey.set(key, (byKey.get(key) ?? 0) + 1);
  }
  const mistakeList = [...byKey].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([key, count]) => ({ key, label: labelOf(key), count }));
  const crashes = [...byKey].filter(([k]) => k !== "wrong_answer").sort((a, b) => b[1] - a[1]);
  const mistakes = {
    failedAttempts: failed.length,
    top: mistakeList,
    // the most common mistake that is NOT simply "wrong answer": it is the more useful thing to work on
    mostCommonCrash: crashes.length ? { key: crashes[0][0], label: labelOf(crashes[0][0]), count: crashes[0][1] } : null,
  };

  // ---- independence: help used on the FIRST solve of each problem, and how many were solved on the first Submit
  const firstSolve = new Map();
  for (const s of solves) if (!firstSolve.has(s.problem)) firstSolve.set(s.problem, s);
  const bucket = { none: 0, one: 0, two: 0, threePlus: 0 };
  for (const s of firstSolve.values()) bucket[s.hintLevel === 0 ? "none" : s.hintLevel === 1 ? "one" : s.hintLevel === 2 ? "two" : "threePlus"]++;
  const firstSubmit = new Map();
  for (const s of [...submissions].filter((x) => x.mode === "submit").sort((a, b) => a.at - b.at)) if (!firstSubmit.has(s.problem)) firstSubmit.set(s.problem, s.verdict);
  const independence = {
    solvedProblems: firstSolve.size, buckets: bucket,
    firstTry: { count: [...firstSubmit.values()].filter((v) => v === "accepted").length, of: firstSubmit.size },
  };

  // ---- retention: topics due for review now, and when the others are due
  const name = new Map(concepts.map((c) => [c.key, c.name]));
  const states = reviewStates(solves, now);
  const rows = [...states.values()].map((st) => ({
    concept: st.concept, name: name.get(st.concept) ?? st.concept, stage: st.stage, intervalDays: st.intervalDays,
    daysSinceLast: round1(st.daysSinceLast), dueInDays: round1((st.dueAt - now) / DAY),
  }));
  const review = {
    due: rows.filter((r) => r.dueInDays <= 0).sort((a, b) => a.dueInDays - b.dueInDays),
    upcoming: rows.filter((r) => r.dueInDays > 0).sort((a, b) => a.dueInDays - b.dueInDays).slice(0, 5),
  };

  // ---- pace
  const gainArgs = { times, updates, solves };
  const pace = { week: learningGain({ ...gainArgs, from: now - 7 * DAY, to: now }), allTime: learningGain(gainArgs) };

  // ---- complexity: the latest scaling check of each problem (a learner may submit the same problem again)
  const title = new Map(problems.map((p) => [p.slug, p.title]));
  const latest = new Map();
  for (const m of [...complexity].sort((a, b) => a.at - b.at)) latest.set(m.problem, m);
  const checked = [...latest.values()].sort((a, b) => b.at - a.at).map((m) => ({ problem: m.problem, title: title.get(m.problem) ?? m.problem, verdict: m.verdict, label: m.label, expected: m.expected }));
  const count = (v) => checked.filter((c) => c.verdict === v).length;
  const scaling = { checked: checked.length, matches: count("matches"), near: count("near"), slow: count("slow"), unclear: count("unclear") + count("unmeasured"), items: checked.slice(0, 12) };

  return {
    totals: { solved: solved.size, problems: problems.length, submits: submissions.filter((s) => s.mode === "submit").length, runs: submissions.filter((s) => s.mode === "run").length },
    skills, strongest: pick(best), weakest: pick(worst), mistakes, independence, review, pace, scaling,
    typicalDifficulty: TYPICAL_DIFFICULTY,
  };
}
