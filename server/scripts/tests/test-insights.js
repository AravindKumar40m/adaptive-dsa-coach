// Engaged time, learning gain and the progress report (server/src/insights). Pure maths, no services needed.
// Every expected number is worked out by hand in the comments.   Run: npm run test:insights
import { BREAK_MS, GAP_CAP_MS, MIN_ENGAGED_MS, engagedMs, learningGain } from "../../src/insights/gain.js";
import { MISTAKE_LABELS, buildProgress } from "../../src/insights/progress.js";

let failures = 0;
const check = (ok, label, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`); };
const near = (a, b, tol = 0.05) => Math.abs(a - b) <= tol;
const MIN = 60_000, DAY = 86_400_000;
const mins = (...xs) => xs.map((x) => x * MIN);

// ---------------------------------------------------------------- engaged time
check(GAP_CAP_MS === 5 * MIN && BREAK_MS === 30 * MIN && MIN_ENGAGED_MS === 20 * MIN, "constants: gap cap 5 min, break 30 min, minimum 20 min before dividing");
check(engagedMs(mins(0, 2, 3)) === 3 * MIN, "events at 0, 2, 3 min: gaps 2 + 1 = 3 min");
check(engagedMs(mins(0, 10)) === 5 * MIN, "a 10-minute gap counts only 5 minutes");
check(engagedMs(mins(0, 29)) === 5 * MIN && engagedMs(mins(0, 30)) === 0 && engagedMs(mins(0, 31)) === 0, "29 min = 5, but 30 min or more is a break: 0");
check(engagedMs(mins(0, 2, 40, 41)) === 3 * MIN, "0, 2, 40, 41: 2 + (break) 0 + 1 = 3 min");
check(engagedMs(mins(4, 0, 3, 1, 2)) === 4 * MIN, "unsorted input is sorted first (0..4 = 4 min)");
check(engagedMs([]) === 0 && engagedMs([5]) === 0, "no events, or one event: 0");
check(engagedMs(mins(0, 1, 2, 3, 4), 2.5 * MIN, 4 * MIN) === 2 * MIN, "a window [2.5, 4] min counts the gaps that END inside it (2->3 and 3->4 = 2 min)");

// ---------------------------------------------------------------- learning gain
const base = 1_000_000_000_000;
const times = Array.from({ length: 25 }, (_, i) => base + i * MIN); // 24 one-minute gaps = 24 min = 0.4 h
const updates = [{ at: base + 5 * MIN, before: 1000, after: 1014.4 }, { at: base + 10 * MIN, before: 1014.4, after: 1008.8 }]; // +14.4 and -5.6 = 8.8
const solves = [{ at: base + 5 * MIN, problem: "a" }, { at: base + 12 * MIN, problem: "b" }, { at: base + 13 * MIN, problem: "a" }]; // a solved twice = 2 problems
let g = learningGain({ times, updates, solves });
check(g.engagedMin === 24 && g.enough && g.points === 8.8 && g.pointsPerHour === 22 && g.solved === 2 && g.solvedPerHour === 5, "24 min, +8.8 points, 2 distinct problems: 8.8 / 0.4 h = 22 per hour, 2 / 0.4 h = 5 per hour", JSON.stringify(g));
g = learningGain({ times: times.slice(0, 11), updates, solves }); // 10 min only
check(g.engagedMin === 10 && !g.enough && g.pointsPerHour === null && g.solvedPerHour === null && g.points === 8.8, "under 20 minutes: no per-hour numbers (they would be extrapolated from too little), but the totals still show");
g = learningGain({ times, updates, solves, from: base + 8 * MIN }); // only the second update (-5.6) and the later solves
check(g.points === -5.6 && g.solved === 2 && near(g.engagedMin, 17, 0.01), "a window keeps only what happened inside it (the -5.6 update; the gaps that end at minute 8 or later = 17 one-minute gaps)", JSON.stringify(g));
check(learningGain({ times: [], updates: [], solves: [] }).pointsPerHour === null, "nothing logged: no crash, no number");
check(learningGain({ times, updates: [{ at: base, before: 1100, after: 1090 }], solves: [] }).pointsPerHour === -25, "a loss is allowed and shown as negative (-10 points / 0.4 h = -25)");

// ---------------------------------------------------------------- the report
const concepts = [
  { key: "arrays", name: "Arrays", prerequisites: [] },
  { key: "strings", name: "Strings", prerequisites: ["arrays"] },
  { key: "dp", name: "Dp", prerequisites: ["strings"] },
];
const problems = [
  { slug: "a1", concept: "arrays", title: "A1" }, { slug: "a2", concept: "arrays", title: "A2" }, { slug: "a3", concept: "arrays", title: "A3" },
  { slug: "s1", concept: "strings", title: "S1" }, { slug: "d1", concept: "dp", title: "D1" },
];
const now = base + 100 * DAY;
const d = (n) => now - 10 * DAY + n * DAY; // "day 0" is 10 days before now
const sub = (i, problem, mode, verdict, errorFamily = null) => ({ problem, mode, verdict, errorFamily, at: d(0) + i });
const submissions = [
  sub(1, "a1", "submit", "accepted"), sub(2, "a2", "submit", "wrong_answer"), sub(3, "a2", "run", "wrong_answer"), sub(4, "a2", "run", "wrong_answer"),
  sub(5, "a2", "run", "runtime_error", "index_out_of_range"), sub(6, "a2", "run", "runtime_error", "index_out_of_range"), sub(7, "a1", "run", "time_limit"),
  sub(8, "a2", "submit", "compile_error", "syntax"), sub(9, "a2", "submit", "internal_error"), sub(10, "a2", "submit", "accepted"),
];
const solvesRows = [
  { concept: "arrays", problem: "a1", title: "A1", at: d(0), fails: 0, hintLevel: 0 },
  { concept: "arrays", problem: "a2", title: "A2", at: d(5), fails: 0, hintLevel: 2 },
  { concept: "arrays", problem: "a1", title: "A1", at: d(6), fails: 0, hintLevel: 3 }, // a repeat solve
];
const weekTimes = Array.from({ length: 25 }, (_, i) => d(9) + i * MIN); // 24 min of work on day 9
const rUpdates = [{ at: d(0), before: 1000, after: 1040 }, { at: d(9) + 5 * MIN, before: 1040, after: 1054.4 }, { at: d(9) + 10 * MIN, before: 1054.4, after: 1048.8 }];
const input = {
  concepts, problems, ratings: new Map([["arrays", 1100], ["strings", 950]]), attempts: new Map([["arrays", 3], ["strings", 1]]), solved: new Set(["a1", "a2"]),
  solves: solvesRows, submissions, updates: rUpdates, times: [d(0), d(0) + MIN, ...weekTimes], now,
};
const p = buildProgress(input);

// chance to solve a typical medium (1200): arrays 1100 -> 1/(1+10^(100/400)) = 0.360; strings 950 -> 1/(1+10^(250/400)) = 0.192; dp (default 1000) -> 1/(1+10^0.5) = 0.240
const by = Object.fromEntries(p.skills.map((s) => [s.concept, s]));
check(p.skills.length === 3 && by.arrays.chance === 36 && by.strings.chance === 19 && by.dp.chance === 24, "skills: every topic with problems, and its chance of solving a typical medium (36%, 19%, 24%)", JSON.stringify(p.skills.map((s) => [s.concept, s.chance])));
check(by.arrays.rating === 1100 && by.arrays.solved === 2 && by.arrays.total === 3 && by.arrays.unlocked && by.strings.unlocked && !by.dp.unlocked && by.dp.missing[0] === "strings", "ratings, solved / total, and the unlock state (strings open, dp still locked behind strings)");
check(p.strongest?.concept === "arrays" && p.weakest?.concept === "strings", "strongest = arrays (1100), weakest open topic = strings (950)");
const oneTopic = buildProgress({ ...input, attempts: new Map([["arrays", 3]]), ratings: new Map([["arrays", 1100]]) });
check(oneTopic.strongest === null && oneTopic.weakest === null, "with only one practised topic there is no 'strongest' or 'weakest' (they would be the same topic)");

check(p.mistakes.failedAttempts === 7, "7 failed attempts (3 wrong answers, 2 index errors, 1 time limit, 1 syntax; the accepted and the runner error are not mistakes)");
check(JSON.stringify(p.mistakes.top.map((m) => [m.key, m.count])) === JSON.stringify([["wrong_answer", 3], ["index_out_of_range", 2], ["time_limit", 1], ["syntax", 1]]), "ordered by how often: wrong answer 3, index 2, time limit 1, syntax 1");
check(p.mistakes.mostCommonCrash?.key === "index_out_of_range" && p.mistakes.mostCommonCrash.count === 2 && /Index out of range/.test(p.mistakes.mostCommonCrash.label), "the most common mistake that is not just 'wrong answer' is the index error, in plain words");
check(Object.keys(MISTAKE_LABELS).every((k) => MISTAKE_LABELS[k].length > 8), "every mistake family has a plain-language label");
check(buildProgress({ ...input, submissions: [] }).mistakes.mostCommonCrash === null, "no failures: no 'most common mistake'");

check(p.independence.solvedProblems === 2 && p.independence.buckets.none === 1 && p.independence.buckets.two === 1 && p.independence.buckets.threePlus === 0, "independence counts the FIRST solve of each problem (a1 with no hint, a2 with level 2); the repeat with level 3 is not counted");
check(p.independence.firstTry.count === 1 && p.independence.firstTry.of === 2, "first-Submit success: a1 yes, a2 no = 1 of 2");

// arrays: solve day 0 (due day 1), solve day 5 = a clean review (hint 2) -> stage 1, due day 8; the day-6 repeat is early practice. Now = day 10.
check(p.review.due.length === 1 && p.review.due[0].concept === "arrays" && p.review.due[0].stage === 1 && p.review.due[0].dueInDays === -2, "review: arrays is due, 2 days past its day-8 date (stage 1)", JSON.stringify(p.review.due));
check(p.review.upcoming.length === 0, "and nothing else is scheduled");

// week: 24 min, updates on day 9 (+14.4, -5.6 = 8.8) => 22 per hour; solves in the last 7 days: a2 (day 5) and a1 (day 6) = 2 => 5 per hour
check(p.pace.week.engagedMin === 24 && p.pace.week.points === 8.8 && p.pace.week.pointsPerHour === 22 && p.pace.week.solved === 2 && p.pace.week.solvedPerHour === 5, "pace, last 7 days: 24 min, +8.8 points = 22 per hour, 2 problems = 5 per hour", JSON.stringify(p.pace.week));
// all time: 24 min + the 1-minute gap on day 0 = 25 min; points 40 + 8.8 = 48.8 -> 48.8 / (25/60) = 117.12; solved a1, a2 = 2 -> 4.8 per hour
check(p.pace.allTime.engagedMin === 25 && p.pace.allTime.points === 48.8 && p.pace.allTime.pointsPerHour === 117.1 && p.pace.allTime.solvedPerHour === 4.8, "pace, all time: 25 min, +48.8 points = 117.1 per hour, 4.8 problems per hour", JSON.stringify(p.pace.allTime));
check(p.totals.solved === 2 && p.totals.problems === 5 && p.totals.submits === 5 && p.totals.runs === 5, "totals: 2 of 5 solved, 5 Submits, 5 Runs");

const empty = buildProgress({ concepts, problems, ratings: new Map(), attempts: new Map(), solved: new Set(), solves: [], submissions: [], updates: [], times: [], now });
check(empty.skills.every((s) => s.rating === 1000 && s.chance === 24) && empty.strongest === null && empty.weakest === null && empty.mistakes.top.length === 0 && empty.review.due.length === 0 && empty.pace.week.pointsPerHour === null && empty.independence.firstTry.of === 0, "a brand-new learner: everything is empty or at the starting rating, nothing crashes");

console.log(failures === 0 ? "\nALL INSIGHTS CHECKS PASSED" : `\n${failures} INSIGHTS CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
