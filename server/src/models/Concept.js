import mongoose from "mongoose";

const schema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  prerequisites: [String], // concept keys that must be solid before this one unlocks
  order: Number,
});

export const Concept = mongoose.model("Concept", schema);
