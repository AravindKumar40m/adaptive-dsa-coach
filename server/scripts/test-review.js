// Spaced review: schedule, solve attribution, which review problem is offered, and the "why" sentences.
// Pure maths, no services needed. Expected numbers are worked out by hand in the comments.
// Run: npm run test:review
import { conceptStatus } from "../src/picker.js";
import { REVIEW_INTERVALS_DAYS, REVIEW_TARGET, agoText, buildSolves, historyNote, isCleanSolve, pickReview, reviewStates } from "../src/review.js";

let failures = 0;
const check = (ok, label, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`); };
const near = (a, b, tol = 1e-3) => Math.abs(a - b) <= tol;

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 0, 1);
const day = (n) => T0 + n * DAY;
const solve = (concept, n, extra = {}) => ({ concept, problem: `${concept}-${n}`, title: `T${n}`, at: day(n), fails: 0, hintLevel: 0, ...extra });

// ---------------------------------------------------------------- the schedule
check(JSON.stringify(REVIEW_INTERVALS_DAYS) === "[1,3,7,14,30]", "the intervals are 1, 3, 7, 14 and 30 days");
let st = reviewStates([solve("arrays", 0)], day(0.5)).get("arrays");
check(st.stage === 0 && st.dueAt === day(1) && st.due === false, "one solve: due after 1 day, not due after half a day");
check(reviewStates([solve("arrays", 0)], day(1)).get("arrays").due === true, "...and due exactly when the day is up");
st = reviewStates([solve("arrays", 0)], day(3)).get("arrays");
check(near(st.overdueRatio, 2) && near(st.daysSinceLast, 3), "3 days later it is 2 whole intervals late (ratio (3-1)/1 = 2), last practised 3 days ago");

// a chain of clean reviews, each done a little after it was due: stages 1, 2, 3, 4 and then it stays at 4
const chain = [0, 1.5, 4.6, 12, 27, 60].map((n) => solve("arrays", n));
const expectDue = [1, 4.5, 11.6, 26, 57, 90]; // 0+1, 1.5+3, 4.6+7, 12+14, 27+30, 60+30 (the last stage repeats)
const expectStage = [0, 1, 2, 3, 4, 4];
chain.forEach((_, i) => {
  const s = reviewStates(chain.slice(0, i + 1), day(100)).get("arrays");
  check(s.stage === expectStage[i] && near(s.dueAt, day(expectDue[i]), 1), `after solve ${i + 1} of the chain: stage ${expectStage[i]}, due on day ${expectDue[i]}`);
});

st = reviewStates([solve("arrays", 0), solve("arrays", 0.2), solve("arrays", 0.4)], day(0.5)).get("arrays");
check(st.stage === 0 && st.dueAt === day(1), "extra practice before the due time does not move the schedule (3 solves on day 0: still due on day 1)");
st = reviewStates([solve("arrays", 0), solve("arrays", 2, { hintLevel: 3 })], day(2)).get("arrays");
check(st.stage === 0 && near(st.dueAt, day(3), 1), "a review solved with hint level 3 does not advance: the same 1-day wait again (due on day 3)");
st = reviewStates([solve("arrays", 0, { hintLevel: 4 })], day(0)).get("arrays");
check(st.stage === 0 && st.dueAt === day(1), "a first solve with every hint still starts the clock (due after 1 day)");
check(isCleanSolve({ hintLevel: 2, fails: 2 }) && !isCleanSolve({ hintLevel: 3, fails: 0 }) && !isCleanSolve({ hintLevel: 0, fails: 3 }), "clean = at most hint level 2 and 2 failed submits");
const two = reviewStates([solve("arrays", 0), solve("strings", 0.5)], day(2));
check(two.size === 2 && two.get("strings").dueAt === day(1.5), "each topic has its own clock");

// ---------------------------------------------------------------- which solves belong to which accepted Submit
const t = (n) => new Date(day(n));
const problems = [{ slug: "p", concept: "arrays", title: "P" }];
const rows = buildSolves({
  problems,
  accepted: [{ problem: "p", createdAt: t(3) }, { problem: "p", createdAt: t(5) }, { problem: "ghost", createdAt: t(4) }],
  fails: [{ problem: "p", createdAt: t(1) }, { problem: "p", createdAt: t(4.5) }],
  hints: [{ problem: "p", level: 1, createdAt: t(1) }, { problem: "p", level: 2, createdAt: t(2) }, { problem: "p", level: 1, createdAt: t(4) }],
});
check(rows.length === 2, "an accepted Submit of an unknown problem is ignored");
check(rows[0].fails === 1 && rows[0].hintLevel === 2, "the first solve owns the failure and the level-2 hint that came before it");
check(rows[1].fails === 1 && rows[1].hintLevel === 1, "the repeat solve owns only what happened after the first solve (1 failure, hint level 1), not the earlier help");
check(rows[0].concept === "arrays" && rows[0].title === "P" && rows[0].at === day(3), "each row carries the topic, title and time");

// ---------------------------------------------------------------- which review problem is offered
const concepts = [
  { key: "arrays", name: "Arrays", prerequisites: [] },
  { key: "strings", name: "Strings", prerequisites: ["arrays"] },
  { key: "dp", name: "Dp", prerequisites: ["strings"] },
];
const P = (slug, concept, rating, difficulty = "easy") => ({ slug, concept, rating, difficulty, title: slug.toUpperCase() });
const probs = [
  P("a-done", "arrays", 900), P("a-done2", "arrays", 900),
  P("a-mid", "arrays", 800), P("a-low", "arrays", 700), P("a-hard", "arrays", 1500, "hard"), P("a-1100", "arrays", 1100),
  P("s-1", "strings", 900), P("d-1", "dp", 900),
];
const base = (over = {}) => {
  const solved = over.solved ?? new Set(["a-done"]);
  return { concepts, problems: probs, difficulty: new Map(), ratings: new Map([["arrays", 1000]]), solved, exclude: new Set(), solveInfo: new Map(), status: conceptStatus({ concepts, problems: probs, solved }), ...over };
};
// expected success for a rating-1000 learner: vs 800 = 1/(1+10^-0.5) = 0.7597, vs 700 = 1/(1+10^-0.75) = 0.8490, vs 1100 = 0.3599, vs 1500 = 0.0532
const solvedOnDay0 = [solve("arrays", 0, { problem: "a-done" })];
check(pickReview({ ...base(), states: reviewStates(solvedOnDay0, day(0.5)) }) === null, "nothing is due after half a day: no review");
let pick = pickReview({ ...base(), states: reviewStates(solvedOnDay0, day(2)) });
check(pick && pick.mode === "review" && pick.problem.slug === "a-mid" && pick.review.repeat === false, "due: the fresh problem closest to a 78% chance is chosen (800 gives 0.760, 700 gives 0.849)", `(${pick?.problem.slug}, ${pick?.expectedSuccess.toFixed(3)})`);
check(near(pick.expectedSuccess, 0.7597, 0.001) && REVIEW_TARGET === 0.78, "its expected success is the Elo value 0.760");
check(!pick.candidates.some((c) => ["a-hard", "a-1100", "a-done"].includes(c.slug)), "hopeless (under 55%) and already-solved problems are not candidates", pick.candidates.map((c) => c.slug).join(","));
check(pick.review.concept === "arrays" && pick.review.stage === 0 && pick.review.intervalDays === 1, "the review details say topic, stage and interval");
check(/Arrays review/.test(pick.reason) && /2 days ago/.test(pick.reason) && /fresh Arrays problem/.test(pick.reason) && /76% chance/.test(pick.reason), "the reason says what, how long ago, and the chance", `"${pick.reason}"`);
pick = pickReview({ ...base({ exclude: new Set(["a-mid"]) }), states: reviewStates(solvedOnDay0, day(2)) });
check(pick.problem.slug === "a-low", "a skipped review problem is not offered again: the next best fresh one is");
pick = pickReview({ ...base({ exclude: new Set(["a-mid", "a-low", "a-done2"]) }), states: reviewStates(solvedOnDay0, day(2)) }); // a-done2 is unsolved here: another fresh option
check(pick.problem.slug === "a-done" && pick.review.repeat === true && /rating will not change/.test(pick.reason), "when no fresh problem is suitable, a problem the learner solved before is offered, and the text says the rating will not change");

// the repeat chosen is the hardest-won one
const solvedBoth = new Set(["a-done", "a-done2"]);
const info = new Map([["a-done", { fails: 0, hintLevel: 0, at: day(0) }], ["a-done2", { fails: 2, hintLevel: 1, at: day(0.1) }]]);
const noFresh = new Set(["a-mid", "a-low", "a-hard", "a-1100"]);
pick = pickReview({ ...base({ solved: solvedBoth, exclude: noFresh, solveInfo: info }), states: reviewStates([solve("arrays", 0, { problem: "a-done" }), solve("arrays", 0.1, { problem: "a-done2", fails: 2, hintLevel: 1 })], day(2)) });
check(pick.problem.slug === "a-done2" && /2 failed attempts and hint level 1/.test(pick.reason), "the repeat is the one solved with the most help (2 failures + hint 1), and the reason mentions it", `(${pick?.problem.slug})`);

// most overdue first, and locked topics are never reviewed
const solvedTwo = new Set(["a-done", "a-done2", "s-1"]);
const states2 = reviewStates([solve("arrays", 0, { problem: "a-done" }), solve("arrays", 0.1, { problem: "a-done2" }), solve("strings", 5, { problem: "s-1" })], day(6.5));
// arrays: due day 1, interval 1 -> ratio 5.5.  strings: due day 6, interval 1 -> ratio 0.5
pick = pickReview({ ...base({ solved: solvedTwo }), states: states2 });
check(pick.review.concept === "arrays" && near(pick.review.overdueRatio, 5.5, 0.01) && pick.review.dueConcepts === 2, "with two topics due, the one that is further past its date goes first (ratio 5.5 beats 0.5)");
const lockedStatus = new Map([["arrays", { unlocked: false }]]);
check(pickReview({ ...base(), states: reviewStates(solvedOnDay0, day(2)), status: lockedStatus }) === null, "a locked topic is never offered for review");

// ---------------------------------------------------------------- the "why" sentences
check(agoText(0.4) === "earlier today" && agoText(1.9) === "yesterday" && agoText(8) === "8 days ago", "agoText: earlier today, yesterday, 8 days ago");
const noteNow = day(3);
check(historyNote("Arrays", { title: "Peak Altitude", at: day(0), fails: 0, hintLevel: 0 }, noteNow) === 'Your last Arrays problem ("Peak Altitude") was 3 days ago, with no help.', "a clean last solve: facts only, no help");
check(historyNote("Arrays", { title: "Peak Altitude", at: day(2.5), fails: 2, hintLevel: 1 }, noteNow) === 'Your last Arrays problem ("Peak Altitude") was earlier today, after 2 failed attempts and hint level 1.', "a hard-won solve names the failures and the hint level");
check(historyNote("Arrays", undefined, noteNow) === "", "no earlier solve: nothing is said");

console.log(failures === 0 ? "\nALL REVIEW CHECKS PASSED" : `\n${failures} REVIEW CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
