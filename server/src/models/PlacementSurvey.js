import mongoose from "mongoose";

// The optional self-assessment a learner can fill in at the start: for each topic how well they think they know it
// (0 never heard of it ... 4 could teach it) and their overall experience. It becomes a WEAK starting guess for the knowledge model.
// Whether it actually predicts anything is tested later on real data (it is stored exactly as given).
const schema = new mongoose.Schema(
  {
    learnerId: { type: String, required: true, unique: true },
    answers: mongoose.Schema.Types.Mixed, // { concept: 0..4 }  (a topic left out = no answer)
    experience: Number, // 0 brand new, 1 some, 2 a fair amount, 3 a lot
  },
  { timestamps: true }
);

export const PlacementSurvey = mongoose.model("PlacementSurvey", schema);
