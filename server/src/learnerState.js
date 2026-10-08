// Loads everything the picker and the skills panel need for one learner.
import { Concept } from "./models/Concept.js";
import { Problem } from "./models/Problem.js";
import { ProblemDifficulty } from "./models/ProblemDifficulty.js";
import { SkillRating } from "./models/SkillRating.js";
import { Submission } from "./models/Submission.js";

export async function loadLearnerState(learnerId) {
  const [concepts, problems, difficulties, rated, solvedSlugs] = await Promise.all([
    Concept.find().sort({ order: 1 }).lean(),
    Problem.find().select("slug title concept difficulty rating -_id").lean(),
    ProblemDifficulty.find().lean(),
    SkillRating.find({ learnerId }).lean(),
    Submission.distinct("problem", { learnerId, mode: "submit", verdict: "accepted" }),
  ]);
  return {
    concepts,
    problems,
    difficulty: new Map(difficulties.map((d) => [d.problem, d.difficulty])), // missing = still the seed rating
    ratings: new Map(rated.map((r) => [r.concept, r.rating])),
    attempts: new Map(rated.map((r) => [r.concept, r.attempts])),
    solved: new Set(solvedSlugs),
  };
}
