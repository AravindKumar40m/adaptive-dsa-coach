import mongoose from "mongoose";

// The learner's code at a moment while they work (saved about every 30 seconds when it changed, and when they switch
// problem or language). Together with the code stored on every Run/Submit this shows how a solution grew.
// Raw material for a later "how did their reasoning evolve" study; nothing uses it yet. Consent wording lists it.
const schema = new mongoose.Schema(
  {
    learnerId: { type: String, required: true },
    problem: { type: String, required: true },
    language: String,
    code: String,
    chars: Number,
    hash: String, // sha256 of the code: identical snapshots are not stored twice in a row
    trigger: { type: String, enum: ["timer", "switch"] },
    seq: Number, // 1, 2, 3 ... per learner and problem
    msSinceOpen: Number, // time since the problem was opened in the browser (clamped, sent by the page)
    sessionId: String,
    loggingVersion: String,
  },
  { timestamps: true }
);
schema.index({ learnerId: 1, problem: 1, createdAt: 1 });

export const CodeSnapshot = mongoose.model("CodeSnapshot", schema);
