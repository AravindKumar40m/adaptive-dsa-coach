// Loads a learner's solve history (database side of review.js).
import { HintEvent } from "../models/HintEvent.js";
import { Submission } from "../models/Submission.js";
import { buildSolves } from "../recommend/review.js";

const FAIL_VERDICTS = ["wrong_answer", "runtime_error", "time_limit"];

/** Every accepted Submit of this learner with the help and failures that belonged to it, oldest first. */
export async function loadSolveHistory(learnerId, problems) {
  const [accepted, fails, hints] = await Promise.all([
    Submission.find({ learnerId, mode: "submit", verdict: "accepted" }).select("problem createdAt -_id").lean(),
    Submission.find({ learnerId, mode: "submit", verdict: { $in: FAIL_VERDICTS } }).select("problem createdAt -_id").lean(),
    HintEvent.find({ learnerId }).select("problem level createdAt -_id").lean(),
  ]);
  return buildSolves({ accepted, fails, hints, problems });
}
