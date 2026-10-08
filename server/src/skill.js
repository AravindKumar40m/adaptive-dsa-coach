// Per-concept Elo skill rating (MVP, no model training). Pure functions: no database, easy to test.
// Formula from CLAUDE.md:
//   E = 1 / (1 + 10 ** ((problemDifficulty - userRating) / 400))      expected score
//   S = 0.50*correctness + 0.25*optimality + 0.15*independence + 0.10*efficiency      actual score, 0..1
//   userRating += K * (S - E)        K = 40 for the first 10 counted attempts on a concept, then 16
//   problemDifficulty -= 4 * (S - E)
//
// Today correctness, independence (hints used) and efficiency can be measured. optimality needs the complexity
// checker (phase 2), so it is null and the remaining weights are rescaled so S stays in 0..1.

export const START_RATING = 1000;
export const WEIGHTS = { correctness: 0.5, optimality: 0.25, independence: 0.15, efficiency: 0.1 };
export const MAX_COUNTED_FAILS = 3; // failed submits per problem that still move the rating
export const PARTIAL_CREDIT_CAP = 0.4; // a failing solution can never score like a passing one
const INDEPENDENCE_SCORES = [1, 0.75, 0.5, 0.25, 0]; // help level shown before the accepted solution: none, nudge, pattern, pseudocode, walkthrough
const ATTEMPT_SCORES = [1, 0.7, 0.4, 0.2]; // efficiency part: 0, 1, 2, 3+ failed submits before the accepted one
const EXPECTED_SECONDS = { easy: 600, medium: 1200, hard: 2400 }; // full speed credit up to this, none at 3x

export const expectedScore = (rating, difficulty) => 1 / (1 + 10 ** ((difficulty - rating) / 400));
export const kFactor = (attemptsOnConcept) => (attemptsOnConcept < 10 ? 40 : 16);

// 1 when fast enough, falling linearly to 0 at three times the expected time. null = time unknown.
export function speedScore(seconds, difficultyLabel) {
  if (seconds == null || !Number.isFinite(seconds)) return null;
  const expected = EXPECTED_SECONDS[difficultyLabel] ?? EXPECTED_SECONDS.medium;
  if (seconds <= expected) return 1;
  if (seconds >= 3 * expected) return 0;
  return 1 - (seconds - expected) / (2 * expected);
}

/**
 * How well did this submission go? Returns the parts and the combined score S (0..1).
 * @param {{accepted:boolean, passed:number, total:number, failsBefore:number, secondsSpent:number|null, difficultyLabel:string}} s
 */
export function scoreSubmission({ accepted, passed, total, failsBefore, secondsSpent, difficultyLabel, hintLevel = 0 }) {
  const correctness = accepted ? 1 : PARTIAL_CREDIT_CAP * (total > 0 ? passed / total : 0);
  let efficiency = 0; // only an accepted solution earns efficiency credit
  if (accepted) {
    const attemptsScore = ATTEMPT_SCORES[Math.min(failsBefore, ATTEMPT_SCORES.length - 1)];
    const speed = speedScore(secondsSpent, difficultyLabel);
    efficiency = speed == null ? attemptsScore : 0.6 * attemptsScore + 0.4 * speed;
  }
  // like efficiency, independence only earns credit for a solution that passes
  const independence = accepted ? INDEPENDENCE_SCORES[Math.min(Math.max(hintLevel, 0), INDEPENDENCE_SCORES.length - 1)] : 0;
  const components = { correctness, optimality: null, independence, efficiency };
  let weighted = 0;
  let weightSum = 0;
  for (const [name, weight] of Object.entries(WEIGHTS)) {
    if (components[name] != null) {
      weighted += weight * components[name];
      weightSum += weight;
    }
  }
  return { components, score: weighted / weightSum };
}

/** Elo step: how far do the learner's rating and the problem's difficulty move? */
export function updateRatings({ userRating, attemptsOnConcept, problemDifficulty, score }) {
  const expected = expectedScore(userRating, problemDifficulty);
  const k = kFactor(attemptsOnConcept);
  const userDelta = k * (score - expected);
  const difficultyDelta = -4 * (score - expected);
  return {
    expected, k, userDelta, difficultyDelta,
    newUserRating: userRating + userDelta,
    newDifficulty: problemDifficulty + difficultyDelta,
  };
}
