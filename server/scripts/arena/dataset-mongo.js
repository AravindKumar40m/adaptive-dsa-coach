// Real learner logs as arena input: one event per (learner, problem) = the FIRST Submit, label y = it was accepted.
import mongoose from "mongoose";
import { config } from "../../src/config.js";
import { Problem } from "../../src/models/Problem.js";
import { Submission } from "../../src/models/Submission.js";

export async function loadFromMongo() {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
  try {
    const problems = await Problem.find().select("slug concept rating skills -_id").lean();
    const subs = await Submission.find({ mode: "submit" }).sort({ createdAt: 1 }).select("learnerId problem verdict createdAt -_id").lean();
    const byLearner = new Map();
    for (const s of subs) {
      if (s.verdict === "compile_error" || s.verdict === "internal_error") continue; // not evidence about the skill
      const events = byLearner.get(s.learnerId) ?? new Map();
      if (!events.has(s.problem)) events.set(s.problem, { slug: s.problem, t: s.createdAt.getTime(), y: s.verdict === "accepted" ? 1 : 0 });
      byLearner.set(s.learnerId, events);
    }
    const sequences = [...byLearner].map(([learner, events]) => ({ learner, events: [...events.values()] })).filter((q) => q.events.length >= 2);
    return { sequences, catalogProblems: problems, rawSubmissions: subs.length };
  } finally {
    await mongoose.disconnect();
  }
}
