import mongoose from "mongoose";

// One row per Run or Submit click: the most important learner table (see CLAUDE.md).
// Logged from day one even though the MVP does not use it yet.
const schema = new mongoose.Schema(
  {
    learnerId: { type: String, required: true, index: true }, // anonymous id from the browser until real accounts exist
    problem: { type: String, required: true, index: true }, // problem slug
    language: String,
    mode: { type: String, enum: ["run", "submit"] },
    code: String, // exactly what the learner sent (consent notice shown in the UI)
    verdict: String, // accepted | wrong_answer | runtime_error | time_limit | compile_error
    passed: Number,
    total: Number,
    perTest: [{ idx: Number, verdict: String, _id: false }],
    timeSec: Number, // CPU time Judge0 measured for the whole run
    memoryKb: Number,
    compileOutput: String,
    stderr: String,
    durationMs: Number, // wall time of our API call (queueing + sandbox)
    startedAt: Date, // when the learner opened the problem (sent by the browser)
    secondsSpent: Number, // time from startedAt to this click; null if unknown
  },
  { timestamps: true } // createdAt = when the learner clicked
);

export const Submission = mongoose.model("Submission", schema);
