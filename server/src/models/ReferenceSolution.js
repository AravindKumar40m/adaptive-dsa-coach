import mongoose from "mongoose";

// Our own solutions (brute / better / optimal). Never sent to learners.
const schema = new mongoose.Schema({
  problem: { type: String, required: true, index: true },
  approach: { type: String, enum: ["brute", "better", "optimal"] },
  language: String,
  code: String,
  time: String,
  space: String,
  expectSlow: Boolean, // true = may time out on large tests on purpose
  testIdx: [Number], // run only these tests (null/empty = all)
});

export const ReferenceSolution = mongoose.model("ReferenceSolution", schema);
