// Removes everything we recorded about one learner (their practice history, ratings and hints).
import { CodeSnapshot } from "./models/CodeSnapshot.js";
import { HintEvent } from "./models/HintEvent.js";
import { MetricEvent } from "./models/MetricEvent.js";
import { whoHash } from "./metrics.js";
import { KnowledgeState } from "./models/KnowledgeState.js";
import { LearnerActivity } from "./models/LearnerActivity.js";
import { ModelPrediction } from "./models/ModelPrediction.js";
import { PlacementSurvey } from "./models/PlacementSurvey.js";
import { ProblemEvent } from "./models/ProblemEvent.js";
import { RecommendationEvent } from "./models/RecommendationEvent.js";
import { RatingUpdate } from "./models/RatingUpdate.js";
import { SkillRating } from "./models/SkillRating.js";
import { Submission } from "./models/Submission.js";

export async function eraseLearnerData(learnerId) {
  const submissions = await Submission.deleteMany({ learnerId });
  await SkillRating.deleteMany({ learnerId });
  await RatingUpdate.deleteMany({ learnerId });
  await HintEvent.deleteMany({ learnerId });
  await ProblemEvent.deleteMany({ learnerId });
  await RecommendationEvent.deleteMany({ learnerId });
  await LearnerActivity.deleteMany({ learnerId });
  await KnowledgeState.deleteMany({ learnerId });
  await PlacementSurvey.deleteMany({ learnerId });
  await ModelPrediction.deleteMany({ learnerId });
  await CodeSnapshot.deleteMany({ learnerId });
  await MetricEvent.deleteMany({ who: whoHash(learnerId) });
  return { deleted: submissions.deletedCount };
}
