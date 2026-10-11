// Struggle nudge (rules only, no model): "does this learner look stuck right now?"
// Pure function: no database. The database side is nudge.js. Evaluated after a Run or Submit that did NOT pass,
// never while the learner is typing, so it cannot interrupt them.
//
// A hint is suggested only when ALL of these are true (each one stops the nudge from being annoying):
//   1. at least 3 failed attempts (Run or Submit) on this problem since it was opened
//   2. at least half of the expected time for the problem's level has passed
//   3. no progress: the latest attempt passes no more tests than an earlier attempt of the same kind
//   4. the learner has not already opened the second hint (help level < 2)
//   5. fewer than 2 nudges shown on this problem, and the last one was more than 10 minutes ago
import { EXPECTED_SECONDS } from "./skill.js";

export const STRUGGLE_RULE = "struggle-1";
export const MIN_FAILED_ATTEMPTS = 3;
export const MIN_TIME_FRACTION = 0.5;
export const MAX_NUDGES_PER_PROBLEM = 2;
export const NUDGE_GAP_MS = 10 * 60_000;
export const FAILED = ["wrong_answer", "runtime_error", "time_limit", "compile_error"];

const share = (a) => (a.total > 0 ? a.passed / a.total : 0);

/**
 * @param {{attempts:[{mode, verdict, passed, total, at}], secondsSpent:number|null, difficultyLabel:string, helpLevel:number, shownAt:number[], now?:number}} a
 *   attempts: this learner's Run/Submit clicks on the problem since it was opened, oldest first, the CURRENT one last.
 * @returns {{offer:boolean, blockedBy:string[], signals:object, nextLevel:number|null}}
 */
export function evaluateStruggle({ attempts, secondsSpent, difficultyLabel, helpLevel, shownAt = [], now = Date.now() }) {
  const current = attempts.at(-1);
  const expectedSeconds = EXPECTED_SECONDS[difficultyLabel] ?? EXPECTED_SECONDS.medium;
  const failedAttempts = attempts.filter((a) => FAILED.includes(a.verdict)).length;
  const sameKind = attempts.slice(0, -1).filter((a) => a.mode === current?.mode);
  const bestBefore = sameKind.length ? Math.max(...sameKind.map(share)) : null;
  const noProgress = current && bestBefore !== null ? share(current) <= bestBefore : false;
  const signals = { failedAttempts, secondsSpent: secondsSpent == null ? null : Math.round(secondsSpent), expectedSeconds, noProgress, helpLevel, shown: shownAt.length };

  const blockedBy = [];
  if (!current || !FAILED.includes(current.verdict)) blockedBy.push("not_a_failure");
  if (failedAttempts < MIN_FAILED_ATTEMPTS) blockedBy.push("few_attempts");
  // an unknown time (the browser did not send it) never triggers a nudge on its own
  if (secondsSpent == null || secondsSpent < MIN_TIME_FRACTION * expectedSeconds) blockedBy.push("not_long_enough");
  if (!noProgress) blockedBy.push("making_progress");
  if (helpLevel >= 2) blockedBy.push("already_has_help");
  if (shownAt.length >= MAX_NUDGES_PER_PROBLEM) blockedBy.push("nudged_enough");
  else if (shownAt.length > 0 && now - Math.max(...shownAt) < NUDGE_GAP_MS) blockedBy.push("nudged_recently");

  const offer = blockedBy.length === 0;
  return { offer, blockedBy, signals, nextLevel: offer ? helpLevel + 1 : null };
}
