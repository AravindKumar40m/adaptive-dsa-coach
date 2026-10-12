// Loads everything the picker and the skills panel need for one learner.
import { Concept } from "../models/Concept.js";
import { Problem } from "../models/Problem.js";
import { ProblemDifficulty } from "../models/ProblemDifficulty.js";
import { PlacementQuiz } from "../models/PlacementQuiz.js";
import { SkillRating } from "../models/SkillRating.js";
import { Submission } from "../models/Submission.js";

export async function loadLearnerState(learnerId) {
  const [concepts, problems, difficulties, rated, solvedSlugs, quiz] = await Promise.all([
    Concept.find().sort({ order: 1 }).lean(),
    Problem.find().select("slug title concept difficulty rating -_id").lean(),
    ProblemDifficulty.find().lean(),
    SkillRating.find({ learnerId }).lean(),
    Submission.distinct("problem", { learnerId, mode: "submit", verdict: "accepted" }),
    PlacementQuiz.findOne({ learnerId, status: "finished" }).sort({ finishedAt: -1 }).select("result.placed -_id").lean(),
  ]);
  return {
    concepts,
    problems,
    difficulty: new Map(difficulties.map((d) => [d.problem, d.difficulty])), // missing = still the seed rating
    ratings: new Map(rated.map((r) => [r.concept, r.rating])),
    attempts: new Map(rated.map((r) => [r.concept, r.attempts])),
    solved: new Set(solvedSlugs),
    placed: new Set(quiz?.result?.placed ?? []), // topics the placement quiz showed the learner already knows (they unlock their dependants)
  };
}
