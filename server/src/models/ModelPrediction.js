import mongoose from "mongoose";

// One row per learner's FIRST gradable Submit on a problem: what the live Elo and the new model predicted BEFORE seeing the
// result, and what happened. This is the real-data scoreboard (npm run arena -- --source mongo replays the same events).
const schema = new mongoose.Schema(
  {
    learnerId: { type: String, required: true, index: true },
    problem: { type: String, required: true },
    submissionId: mongoose.Schema.Types.ObjectId,
    sessionId: String,
    t: { type: Number, required: true }, // time of the Submit (ms)
    y: { type: Number, required: true }, // 1 = accepted on the first gradable Submit
    elo: { type: Number, required: true }, // the production prediction E (before this Submit)
    kt: { type: Number, required: true }, // the new model's prediction (before this Submit)
    difficulty: Number, // the problem difficulty both models used
    modelVersion: String,
    params: mongoose.Schema.Types.Mixed, // the new model's settings at that time
  },
  { timestamps: true }
);
schema.index({ learnerId: 1, t: 1 });

export const ModelPrediction = mongoose.model("ModelPrediction", schema);
