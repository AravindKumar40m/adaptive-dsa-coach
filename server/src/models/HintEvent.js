import mongoose from "mongoose";

// One row each time a learner is shown help: a ladder hint (kind "ladder", level 1-4) or an AI explanation
// (kind "feedback", counted as level 2). The highest level shown on a problem lowers the "independence"
// part of the skill score. Logged from day one like everything else (see CLAUDE.md).
const schema = new mongoose.Schema(
  {
    learnerId: { type: String, required: true, index: true },
    problem: { type: String, required: true },
    kind: { type: String, enum: ["ladder", "feedback"], required: true },
    level: { type: Number, required: true }, // 1 nudge, 2 pattern, 3 pseudocode, 4 walkthrough
    source: { type: String, enum: ["stored", "llm", "cache"] },
    text: String, // what the learner was shown
  },
  { timestamps: true }
);
schema.index({ learnerId: 1, problem: 1 });

export const HintEvent = mongoose.model("HintEvent", schema);
