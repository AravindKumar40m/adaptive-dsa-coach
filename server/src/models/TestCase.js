import mongoose from "mongoose";

// Language-neutral test: JSON arguments in, JSON result out.
const schema = new mongoose.Schema({
  problem: { type: String, required: true, index: true }, // problem slug
  idx: Number,
  kind: { type: String, enum: ["example", "edge", "random"] },
  visible: Boolean, // true = shown to the learner as an example
  args: { type: [mongoose.Schema.Types.Mixed], default: [] },
  expected: mongoose.Schema.Types.Mixed,
});

export const TestCase = mongoose.model("TestCase", schema);
