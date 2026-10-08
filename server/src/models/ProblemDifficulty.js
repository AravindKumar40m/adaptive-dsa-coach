import mongoose from "mongoose";

// The CURRENT difficulty of a problem. It starts at the seed rating from content (easy 900, medium 1200, hard 1500)
// and drifts as learners solve or fail it. Kept separate from Problem so re-seeding content never resets it.
const schema = new mongoose.Schema({
  problem: { type: String, required: true, unique: true }, // problem slug
  difficulty: { type: Number, required: true },
  updates: { type: Number, default: 0 },
});

export const ProblemDifficulty = mongoose.model("ProblemDifficulty", schema);
