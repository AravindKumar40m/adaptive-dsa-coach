import mongoose from "mongoose";

// The new knowledge model's memory of one learner (shadow mode, see kt/shadow.js): per skill a rating, how unsure we
// are about it, how many attempts, and when it was last practised. Nothing here changes what the learner sees.
const schema = new mongoose.Schema(
  {
    learnerId: { type: String, required: true, unique: true },
    skills: mongoose.Schema.Types.Mixed, // { concept: { theta, v, n, last } }
    attempts: { type: Number, default: 0 },
    recent: mongoose.Schema.Types.Mixed, // the last 5 outcomes [{ y, concept }]
    modelVersion: String,
  },
  { timestamps: true }
);

export const KnowledgeState = mongoose.model("KnowledgeState", schema);
