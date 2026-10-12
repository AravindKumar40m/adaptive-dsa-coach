import mongoose from "mongoose";

// One measurement: how the running time of an ACCEPTED Python Submit grew with the input size (see complexity/analyze.js).
// One row per Submit (the same Submit is never measured twice). Erased with the learner's data.
const schema = new mongoose.Schema(
  {
    learnerId: { type: String, required: true },
    problem: { type: String, required: true },
    language: String,
    submissionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    verdict: String, // matches | near | slow | unclear | unmeasured
    label: String, // "n²", "n (or n log n)", "exponential", "instant" ...
    exponent: Number, // slope of ln(time) against ln(n) over the largest sizes
    r2: Number, // how well the points lie on that line
    exponential: Boolean,
    factor: Number, // exponential only: the time multiplier for each +1 in n
    expected: String, // the usual best solution's class
    measuredUpTo: Number, // the largest n that was timed
    points: [{ n: Number, ns: Number, reps: Number, _id: false }], // the fastest call at each size, in nanoseconds
    error: { n: Number, name: String }, // the learner's code stopped at this size
    judgeStatus: Number, // Judge0's own status id (3 = finished, 5 = stopped for taking too long)
    wallMs: Number, // how long the whole analysis took
    message: String, // what the learner was told
    version: String, // COMPLEXITY_VERSION
    configVersion: String,
  },
  { timestamps: true }
);
schema.index({ learnerId: 1, submissionId: 1 }, { unique: true });
schema.index({ learnerId: 1, problem: 1, createdAt: -1 });

export const ComplexityMeasurement = mongoose.model("ComplexityMeasurement", schema);
