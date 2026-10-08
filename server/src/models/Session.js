import mongoose from "mongoose";

// A login. Only a hash of the random cookie value is stored, so a database leak does not give anyone a working session.
const schema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // MongoDB removes the row after this time
});

export const Session = mongoose.model("Session", schema);
