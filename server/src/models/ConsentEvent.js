import mongoose from "mongoose";

// Every time someone agrees to or withdraws a consent, with the text version they saw.
const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    kind: { type: String, enum: ["recording", "ai"], required: true },
    accepted: { type: Boolean, required: true },
    version: String,
  },
  { timestamps: { createdAt: "at", updatedAt: false } }
);

export const ConsentEvent = mongoose.model("ConsentEvent", schema);
