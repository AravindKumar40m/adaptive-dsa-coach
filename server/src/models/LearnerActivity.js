import mongoose from "mongoose";

// One row per learner: where their current session stands (see sessions.js).
const schema = new mongoose.Schema({
  learnerId: { type: String, required: true, unique: true },
  lastAt: Date,
  sessionId: String,
  sessionStartedAt: Date,
  sessionCount: { type: Number, default: 0 },
});

export const LearnerActivity = mongoose.model("LearnerActivity", schema);
