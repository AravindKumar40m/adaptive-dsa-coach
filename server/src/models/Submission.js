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
    perTest: [{ idx: Number, verdict: String, kind: String, _id: false }], // kind: example | edge | random
    timeSec: Number, // CPU time Judge0 measured for the whole run
    memoryKb: Number,
    compileOutput: String,
    stderr: String,
    durationMs: Number, // wall time of our API call (queueing + sandbox)
    startedAt: Date, // when the learner opened the problem (sent by the browser)
    secondsSpent: Number, // time from startedAt to this click; null if unknown
    // ---- Logging v2 (see docs/data-dictionary.md)
    sessionId: String,
    statusId: Number, // Judge0's own status code
    exitCode: Number,
    exitSignal: Number, // 11 = segfault, 8 = divide by zero ...
    wallTimeSec: Number,
    errorName: String, // IndexError, NullPointerException, SIGSEGV ... (null when it did not crash)
    errorFamily: String, // shared vocabulary: index_out_of_range, null_reference, zero_division, syntax, timeout ...
    revealedTest: { idx: Number, kind: String, verdict: String, _id: false }, // the hidden test we showed after this failed Submit (null otherwise)
    firstFailKind: String, // example | edge | random: the kind of the first test that failed
    codeStats: mongoose.Schema.Types.Mixed, // lines, loops, loopDepth, selfCalls, usesSort, usesHash ...
    approach: mongoose.Schema.Types.Mixed, // { closest: brute|better|optimal, similarity, byApproach }
    activity: mongoose.Schema.Types.Mixed, // work pattern since the previous Run/Submit (typing, pasting, pauses)
    openSource: String, // how the problem was reached: rec | library | direct
    recommendationId: mongoose.Schema.Types.ObjectId,
    runsOnProblemBefore: Number, // earlier Run/Submit clicks on this problem
    scoringVersion: String,
    loggingVersion: String,
  },
  { timestamps: true } // createdAt = when the learner clicked
);

export const Submission = mongoose.model("Submission", schema);
