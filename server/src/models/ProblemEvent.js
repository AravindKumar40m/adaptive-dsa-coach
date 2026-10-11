import mongoose from "mongoose";

// What the learner did around a problem, besides running code: opened it (and how), skipped it (and why),
// said how confident they were, how hard it felt, and whether they liked it. The latest row of a kind wins.
// nudge_shown is written by the server only (struggle.js decided to suggest a hint); the learner's answer is nudge_taken or nudge_dismissed.
export const PROBLEM_EVENT_KINDS = ["opened", "skipped", "confidence", "feel", "liked", "nudge_shown", "nudge_taken", "nudge_dismissed"];
const schema = new mongoose.Schema(
  {
    learnerId: { type: String, required: true },
    problem: { type: String, required: true },
    kind: { type: String, enum: PROBLEM_EVENT_KINDS, required: true },
    value: mongoose.Schema.Types.Mixed, // opened: rec|library|direct   confidence: 1-5   feel: too_easy|just_right|too_hard   liked: true|false   skipped: too_hard|too_easy|not_interested|other
    recommendationId: mongoose.Schema.Types.ObjectId, // the recommendation that offered this problem (opened / skipped)
    sessionId: String,
  },
  { timestamps: true }
);
schema.index({ learnerId: 1, problem: 1, kind: 1, createdAt: -1 });

export const ProblemEvent = mongoose.model("ProblemEvent", schema);
