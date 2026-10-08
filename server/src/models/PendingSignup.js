import mongoose from "mongoose";

// A person Google has confirmed, who has NOT yet agreed to the recording consent. No account exists until they do.
// Holds only what Google told us (id + verified email) and disappears by itself after 15 minutes.
const schema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true }, // SHA-256 of the cookie value
  googleSub: { type: String, required: true },
  email: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

export const PendingSignup = mongoose.model("PendingSignup", schema);
