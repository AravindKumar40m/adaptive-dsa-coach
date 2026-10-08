import mongoose from "mongoose";

const consentSchema = new mongoose.Schema({ version: String, at: Date }, { _id: false });

// A person with an account. learnerId is the id every other collection (submissions, ratings, hints) uses,
// so the learning data never contains the email address.
const schema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true }, // lower-case
    passwordHash: { type: String, default: null }, // scrypt$N$r$p$salt$hash (never the password); null = signs in with Google only
    googleSub: { type: String, unique: true, sparse: true }, // Google's permanent id for this person (the email can change, this cannot)
    learnerId: { type: String, required: true, unique: true },
    consent: {
      recording: { type: consentSchema, default: null }, // required to use the platform
      ai: { type: consentSchema, default: null }, // optional: sending code to Anthropic
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", schema);
