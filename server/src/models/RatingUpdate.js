import mongoose from "mongoose";

// Audit log: one row per rating change with every input, so we can always explain WHY a rating moved
// and later use it as training data (see CLAUDE.md: log everything from day one).
const schema = new mongoose.Schema(
  {
    learnerId: { type: String, required: true, index: true },
    concept: String,
    problem: String,
    submissionId: mongoose.Schema.Types.ObjectId,
    ratingBefore: Number,
    ratingAfter: Number,
    difficultyBefore: Number,
    difficultyAfter: Number,
    expected: Number, // E
    score: Number, // S
    k: Number,
    components: mongoose.Schema.Types.Mixed, // { correctness, optimality, independence, efficiency } (null = not measurable yet)
    attemptsOnConceptBefore: Number,
    failsBefore: Number,
    secondsSpent: Number,
    hintLevel: Number, // 0-4: most help shown on this problem before this submit
  },
  { timestamps: true }
);

export const RatingUpdate = mongoose.model("RatingUpdate", schema);
