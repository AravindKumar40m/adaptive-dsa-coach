import mongoose from "mongoose";

// Remembers AI explanations so the same code + result never costs a second API call.
// Holds only the explanation text under a hash key (no learner id); rows expire after 7 days.
const schema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 7 * 24 * 3600 },
});

export const AiFeedbackCache = mongoose.model("AiFeedbackCache", schema);
