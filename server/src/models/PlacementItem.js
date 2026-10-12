import mongoose from "mongoose";

// One placement-quiz question (our content, loaded from content/build/placement.json by `npm run content:placement`).
// `answer` and `explain` stay on the server: the browser only ever gets the prompt, the code and the shuffled options.
const schema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // "arrays-L2"
    concept: { type: String, required: true, index: true },
    level: { type: Number, required: true }, // 1 easy, 2 medium, 3 hard
    kind: { type: String, enum: ["mcq", "trace"] },
    prompt: String,
    code: String,
    options: [String],
    answer: Number, // index into options
    explain: String,
    bankVersion: String,
  },
  { timestamps: true }
);

export const PlacementItem = mongoose.model("PlacementItem", schema);
