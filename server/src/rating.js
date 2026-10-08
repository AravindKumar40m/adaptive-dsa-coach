// Connects the grading result to the Elo maths (skill.js) and the database.
import { Submission } from "./models/Submission.js";
import { SkillRating } from "./models/SkillRating.js";
import { ProblemDifficulty } from "./models/ProblemDifficulty.js";
import { RatingUpdate } from "./models/RatingUpdate.js";
import { helpLevel } from "./hints.js";
import { MAX_COUNTED_FAILS, START_RATING, scoreSubmission, updateRatings } from "./skill.js";

const FAIL_VERDICTS = ["wrong_answer", "runtime_error", "time_limit"];
const MAX_SECONDS = 6 * 3600; // ignore absurd times (tab left open overnight)

/** Seconds since the learner opened the problem, from the browser's startedAt; null if missing or not believable. */
export function secondsSince(startedAt, now = Date.now()) {
  const t = Date.parse(startedAt ?? "");
  if (!Number.isFinite(t)) return null;
  const seconds = (now - t) / 1000;
  return seconds >= 0 && seconds <= MAX_SECONDS ? seconds : null;
}

/** What happened on this problem before? Call BEFORE logging the current submission. */
export async function priorHistory(learnerId, slug) {
  const prior = await Submission.find({ learnerId, problem: slug, mode: "submit" }).select("verdict").lean();
  return {
    alreadySolved: prior.some((s) => s.verdict === "accepted"),
    failsBefore: prior.filter((s) => FAIL_VERDICTS.includes(s.verdict)).length,
  };
}

/**
 * Update the learner's concept rating and the problem's difficulty after a Submit.
 * Returns what to show the learner: { counted, reason?, concept, before, after, delta, ... }
 */
export async function applySubmission({ learnerId, problem, graded, passed, total, history, secondsSpent, submissionId }) {
  const base = { concept: problem.concept };
  if (graded.verdict === "compile_error" || graded.verdict === "internal_error") {
    return { ...base, counted: false, reason: "Compile errors don't change your rating." };
  }
  if (history.alreadySolved) {
    return { ...base, counted: false, reason: "You already solved this problem, so your rating did not change." };
  }
  const accepted = graded.verdict === "accepted";
  if (!accepted && history.failsBefore >= MAX_COUNTED_FAILS) {
    return { ...base, counted: false, reason: `Only the first ${MAX_COUNTED_FAILS} failed submits per problem change your rating.` };
  }

  const skill = await SkillRating.findOneAndUpdate(
    { learnerId, concept: problem.concept },
    { $setOnInsert: { rating: START_RATING, attempts: 0 } },
    { upsert: true, returnDocument: "after" }
  );
  const difficulty = await ProblemDifficulty.findOneAndUpdate(
    { problem: problem.slug },
    { $setOnInsert: { difficulty: problem.rating, updates: 0 } },
    { upsert: true, returnDocument: "after" }
  );

  const hintLevel = await helpLevel(learnerId, problem.slug); // help shown on this problem so far
  const { components, score } = scoreSubmission({
    accepted, passed, total, failsBefore: history.failsBefore, secondsSpent, difficultyLabel: problem.difficulty, hintLevel,
  });
  const step = updateRatings({
    userRating: skill.rating, attemptsOnConcept: skill.attempts, problemDifficulty: difficulty.difficulty, score,
  });

  await SkillRating.updateOne({ _id: skill._id }, { $set: { rating: step.newUserRating }, $inc: { attempts: 1 } });
  await ProblemDifficulty.updateOne({ _id: difficulty._id }, { $set: { difficulty: step.newDifficulty }, $inc: { updates: 1 } });
  await RatingUpdate.create({
    learnerId, concept: problem.concept, problem: problem.slug, submissionId,
    ratingBefore: skill.rating, ratingAfter: step.newUserRating,
    difficultyBefore: difficulty.difficulty, difficultyAfter: step.newDifficulty,
    expected: step.expected, score, k: step.k, components,
    attemptsOnConceptBefore: skill.attempts, failsBefore: history.failsBefore, secondsSpent, hintLevel,
  });

  return {
    ...base, counted: true,
    before: skill.rating, after: step.newUserRating, delta: step.userDelta,
    expected: step.expected, score, k: step.k, components, hintLevel,
  };
}
