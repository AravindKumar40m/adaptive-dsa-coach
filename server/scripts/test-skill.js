// Unit tests for the Elo formulas. No database or Judge0 needed.  Run: npm run test:skill
// Expected numbers are worked out by hand (see comments), not copied from the code's output.
import assert from "node:assert/strict";
import { expectedScore, kFactor, speedScore, scoreSubmission, updateRatings, START_RATING } from "../src/skill.js";

let failures = 0;
const test = (name, fn) => {
  try { fn(); console.log("ok  ", name); } catch (e) { failures++; console.log("FAIL", name, "\n     ", e.message); }
};
const near = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} is not within ${tol} of ${b}`);

test("equal rating and difficulty -> E = 0.5", () => near(expectedScore(1000, 1000), 0.5, 1e-9));
// 10^(-100/400) = 0.56234; 1/(1+0.56234) = 0.64004
test("rating 1000 vs easy 900 -> E = 0.640", () => near(expectedScore(1000, 900), 0.64004, 1e-4));
test("rating 1000 vs hard 1500 -> E = 0.0532", () => near(expectedScore(1000, 1500), 1 / (1 + 10 ** 1.25), 1e-9)); // 0.05327
test("K is 40 below 10 attempts and 16 from 10", () => {
  assert.equal(kFactor(0), 40); assert.equal(kFactor(9), 40); assert.equal(kFactor(10), 16); assert.equal(kFactor(500), 16);
});
test("new learners start at 1000", () => assert.equal(START_RATING, 1000));

test("speed: full credit up to expected time, zero at 3x, linear between", () => {
  assert.equal(speedScore(300, "easy"), 1);
  assert.equal(speedScore(600, "easy"), 1);
  assert.equal(speedScore(1200, "easy"), 0.5); // 1 - (1200-600)/(2*600)
  assert.equal(speedScore(1800, "easy"), 0);
  assert.equal(speedScore(99999, "easy"), 0);
  assert.equal(speedScore(null, "easy"), null);
});

// Weights now: correctness 0.5, independence 0.15, efficiency 0.1 (optimality is still not measurable); they add up to 0.75.
// accepted first try, fast, no hints: correctness 1, independence 1, efficiency 1 -> S = (0.5 + 0.15 + 0.1)/0.75 = 1
test("accepted first try, fast, no hints -> S = 1", () => {
  const r = scoreSubmission({ accepted: true, passed: 21, total: 21, failsBefore: 0, secondsSpent: 100, difficultyLabel: "easy" });
  near(r.score, 1, 1e-9);
  assert.equal(r.components.optimality, null); assert.equal(r.components.independence, 1);
});
// accepted on 3rd try (2 fails), time unknown: efficiency = 0.4 -> S = (0.5 + 0.15 + 0.04)/0.75 = 0.92
test("accepted after 2 fails, time unknown -> S = 0.92", () => {
  near(scoreSubmission({ accepted: true, passed: 21, total: 21, failsBefore: 2, secondsSpent: null, difficultyLabel: "easy" }).score, 0.92, 1e-9);
});
// hint level 2 (pattern): independence 0.5 -> S = (0.5 + 0.075 + 0.1)/0.75 = 0.9
test("accepted first try but after a level-2 hint -> S = 0.9", () => {
  near(scoreSubmission({ accepted: true, passed: 5, total: 5, failsBefore: 0, secondsSpent: 100, difficultyLabel: "easy", hintLevel: 2 }).score, 0.9, 1e-9);
});
// hint level 4 (walkthrough): independence 0 -> S = (0.5 + 0 + 0.1)/0.75 = 0.8
test("accepted after the full walkthrough -> S = 0.8", () => {
  near(scoreSubmission({ accepted: true, passed: 5, total: 5, failsBefore: 0, secondsSpent: 100, difficultyLabel: "easy", hintLevel: 4 }).score, 0.8, 1e-9);
});
test("each extra hint level lowers the score; independence is 1, 0.75, 0.5, 0.25, 0", () => {
  const at = (hintLevel) => scoreSubmission({ accepted: true, passed: 1, total: 1, failsBefore: 0, secondsSpent: 1, difficultyLabel: "easy", hintLevel });
  assert.deepEqual([0, 1, 2, 3, 4].map((l) => at(l).components.independence), [1, 0.75, 0.5, 0.25, 0]);
  for (let l = 1; l <= 4; l++) assert.ok(at(l).score < at(l - 1).score);
});
test("hints never push the score of a solved problem below an unsolved one", () => {
  const worstSolved = scoreSubmission({ accepted: true, passed: 21, total: 21, failsBefore: 9, secondsSpent: 99999, difficultyLabel: "easy", hintLevel: 4 }).score;
  const bestFailed = scoreSubmission({ accepted: false, passed: 20, total: 21, failsBefore: 0, secondsSpent: 1, difficultyLabel: "easy", hintLevel: 0 }).score;
  assert.ok(bestFailed < worstSolved, `${bestFailed} should be < ${worstSolved}`);
});
test("a failed submission gets no independence credit, whatever the hints", () => {
  assert.equal(scoreSubmission({ accepted: false, passed: 3, total: 5, failsBefore: 0, secondsSpent: 1, difficultyLabel: "easy", hintLevel: 0 }).components.independence, 0);
});
// accepted first try but at 2x expected time: speed = 0.5 -> efficiency 0.6 + 0.2 = 0.8 -> S = (0.5 + 0.15 + 0.08)/0.75 = 0.9733
test("accepted first try but slow (2x) -> S = 0.9733", () => {
  // medium expects 1200 s, so use 2x = 2400 s: speed = 1 - (2400-1200)/2400 = 0.5
  near(scoreSubmission({ accepted: true, passed: 5, total: 5, failsBefore: 0, secondsSpent: 2400, difficultyLabel: "medium" }).score, 0.73 / 0.75, 1e-9);
});
test("never-passing submission -> S = 0", () => {
  near(scoreSubmission({ accepted: false, passed: 0, total: 21, failsBefore: 0, secondsSpent: 100, difficultyLabel: "easy" }).score, 0, 1e-9);
});
// 18/21 passed but not accepted: correctness = 0.4*18/21 = 0.34286 -> S = 0.5*0.34286/0.75 = 0.22857
test("18 of 21 tests but not accepted -> S = 0.2286 (partial credit capped)", () => {
  near(scoreSubmission({ accepted: false, passed: 18, total: 21, failsBefore: 0, secondsSpent: 100, difficultyLabel: "easy" }).score, 0.22857, 1e-4);
});
test("a failing solution always scores below any accepted one", () => {
  const failBest = scoreSubmission({ accepted: false, passed: 20, total: 21, failsBefore: 0, secondsSpent: 1, difficultyLabel: "easy" }).score;
  const passWorst = scoreSubmission({ accepted: true, passed: 21, total: 21, failsBefore: 9, secondsSpent: 99999, difficultyLabel: "easy" }).score;
  assert.ok(failBest < passWorst, `${failBest} should be < ${passWorst}`);
});

// learner 1000, problem 900, S = 1, first attempt: E = 0.64004, K = 40 -> +40*0.35996 = +14.40; difficulty -4*0.35996 = -1.44
test("perfect solve: rating +14.40, problem difficulty -1.44", () => {
  const r = updateRatings({ userRating: 1000, attemptsOnConcept: 0, problemDifficulty: 900, score: 1 });
  near(r.userDelta, 14.398, 0.01); near(r.difficultyDelta, -1.4398, 0.001); near(r.newUserRating, 1014.4, 0.01); near(r.newDifficulty, 898.56, 0.01);
});
// S = 0: -40*0.64004 = -25.60, difficulty +2.56
test("total failure: rating -25.60, problem difficulty +2.56", () => {
  const r = updateRatings({ userRating: 1000, attemptsOnConcept: 3, problemDifficulty: 900, score: 0 });
  near(r.userDelta, -25.6, 0.01); near(r.difficultyDelta, 2.56, 0.001);
});
test("experienced learner (10+ attempts) moves less: K = 16", () => {
  near(updateRatings({ userRating: 1000, attemptsOnConcept: 10, problemDifficulty: 900, score: 1 }).userDelta, 16 * 0.35996, 0.01);
});
test("meeting the expectation changes nothing", () => {
  near(updateRatings({ userRating: 1000, attemptsOnConcept: 0, problemDifficulty: 1000, score: 0.5 }).userDelta, 0, 1e-9);
});
test("beating a hard problem pays more than an easy one", () => {
  const easy = updateRatings({ userRating: 1000, attemptsOnConcept: 0, problemDifficulty: 900, score: 1 }).userDelta;
  const hard = updateRatings({ userRating: 1000, attemptsOnConcept: 0, problemDifficulty: 1500, score: 1 }).userDelta;
  assert.ok(hard > easy);
});

console.log(failures === 0 ? "\nAll skill-formula tests passed." : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
