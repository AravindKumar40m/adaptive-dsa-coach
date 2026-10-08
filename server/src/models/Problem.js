import mongoose from "mongoose";

// One coding problem. Tests and reference solutions live in their own collections
// so they are never sent to the browser by accident.
const schema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  concept: { type: String, required: true, index: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
  rating: { type: Number, required: true }, // seed difficulty for Elo (easy 900, medium 1200, hard 1500)
  statement: String, // markdown, written by us
  constraints: [String],
  signature: {
    name: String,
    params: [{ name: String, type: { type: String } }], // types: int, bool, string, int[]
    returns: String,
  },
  examples: [{ args: [mongoose.Schema.Types.Mixed], expected: mongoose.Schema.Types.Mixed, explanation: String }],
  expected: { time: String, space: String }, // best-known complexity (graded in a later step)
  hints: { nudge: String, pattern: String, pseudocode: String, walkthrough: String }, // 4-level ladder
});

export const Problem = mongoose.model("Problem", schema);
