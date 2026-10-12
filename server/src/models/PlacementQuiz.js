import mongoose from "mongoose";

// One attempt at the placement quiz: every answer (which option, right or wrong, how long it took, in what order the
// options were shown) and, once finished, the result and what it changed. Erased with the learner's data.
const answer = new mongoose.Schema(
  {
    item: String, // "arrays-L2"
    concept: String,
    level: Number,
    kind: String,
    chosen: Number, // index into the ORIGINAL options, or -1 for "I don't know"
    correct: Boolean,
    ms: Number, // time the learner took (sent by the page, clamped to 10 minutes)
    order: [Number], // the shuffled order the options were shown in
    at: Date,
  },
  { _id: false }
);
const schema = new mongoose.Schema(
  {
    learnerId: { type: String, required: true },
    status: { type: String, enum: ["in_progress", "finished", "abandoned"], default: "in_progress" },
    answers: [answer],
    stoppedEarly: Boolean, // the learner pressed "stop and see my results"
    result: mongoose.Schema.Types.Mixed, // { topics:[{concept, rating, label, confidence, asked, correct}], placed:[concept], answered, correct }
    applied: [String], // topics whose rating was set from the quiz
    kept: [String], // topics left alone because the learner already has real attempts there
    finishedAt: Date,
    bankVersion: String,
    algorithmVersion: String,
  },
  { timestamps: true }
);
schema.index({ learnerId: 1, createdAt: -1 });

export const PlacementQuiz = mongoose.model("PlacementQuiz", schema);
