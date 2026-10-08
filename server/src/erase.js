// Removes everything we recorded about one learner (their practice history, ratings and hints).
import { HintEvent } from "./models/HintEvent.js";
import { RatingUpdate } from "./models/RatingUpdate.js";
import { SkillRating } from "./models/SkillRating.js";
import { Submission } from "./models/Submission.js";

export async function eraseLearnerData(learnerId) {
  const submissions = await Submission.deleteMany({ learnerId });
  await SkillRating.deleteMany({ learnerId });
  await RatingUpdate.deleteMany({ learnerId });
  await HintEvent.deleteMany({ learnerId });
  return { deleted: submissions.deletedCount };
}
