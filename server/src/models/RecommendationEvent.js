import mongoose from "mongoose";

// Every time the picker chose a problem: WHAT it chose, what else it could have chosen, and how likely each choice was.
// With `propensity` and the candidate list, a later model can be evaluated on this log ("what would it have picked?").
const candidate = new mongoose.Schema(
  { slug: String, concept: String, expectedSuccess: Number, conceptRating: Number, greedyRank: Number, score: Number, parts: mongoose.Schema.Types.Mixed },
  { _id: false }
);
const schema = new mongoose.Schema(
  {
    learnerId: { type: String, required: true, index: true },
    sessionId: String,
    pickerVersion: String,
    policy: String, // v1 (weakest topic, aim 65%) or v2 (recommender2.js)
    v2: mongoose.Schema.Types.Mixed, // v2 only: { slot, target, score, parts, warmup }
    stateKey: String, // the learner's state when this was chosen (last submit + skipped list); the same state reuses the pick
    done: Boolean, // true = nothing left to offer
    chosen: { slug: String, concept: String, difficultyLabel: String, expectedSuccess: Number, conceptRating: Number },
    mode: String, // weakest | closest
    explored: Boolean, // true = a variety pick (not the top choice)
    exploreRate: Number,
    propensity: Number, // probability that THIS problem was chosen under the rules in force
    greedySlug: String, // what the top choice was
    candidates: [candidate], // the best 12 by the top-choice ordering
    fitsCount: Number, // problems inside the 50-80% window
    poolSize: Number, // unlocked, unsolved, not skipped
    openCount: Number,
    solvedCount: Number,
    excludeCount: Number,
    reason: String,
    repeated: Boolean,
  },
  { timestamps: true }
);
schema.index({ learnerId: 1, createdAt: -1 });

export const RecommendationEvent = mongoose.model("RecommendationEvent", schema);
