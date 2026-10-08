import mongoose from "mongoose";

// A learner's current rating for one concept. Created on the first counted submit.
const schema = new mongoose.Schema(
  {
    learnerId: { type: String, required: true },
    concept: { type: String, required: true },
    rating: { type: Number, required: true },
    attempts: { type: Number, default: 0 }, // counted updates on this concept (decides K)
  },
  { timestamps: true }
);
schema.index({ learnerId: 1, concept: 1 }, { unique: true });

export const SkillRating = mongoose.model("SkillRating", schema);
