import mongoose from "mongoose";

// One "step through my code" run (routes/debug.js). The trace itself is NOT stored (it is large and can be made again from the code
// and the input); we keep what is needed to see how the feature is used. Erased with the learner's data.
const schema = new mongoose.Schema(
  {
    learnerId: { type: String, required: true },
    problem: { type: String, required: true },
    sourceKind: { type: String, enum: ["example", "failing", "custom"], required: true },
    sourceIndex: Number, // example number (1-based) for kind "example"
    codeHash: String, // SHA-256 of the code that was traced (the code itself is already stored with the learner's Runs and Submits)
    ok: Boolean, // a trace was produced
    reason: String, // when not ok: unsupported | time_limit | no_trace | bad_trace
    steps: Number,
    calls: Number,
    truncated: String, // steps | time | size | null
    resultKind: String, // returned | raised | error
    errorName: String,
    matchedExpected: Boolean, // example and failing runs only: the returned value equals the expected one
    timeSec: Number,
    version: String, // DEBUG_VERSION
  },
  { timestamps: true }
);
schema.index({ learnerId: 1, problem: 1, createdAt: -1 });

export const DebugRun = mongoose.model("DebugRun", schema);
