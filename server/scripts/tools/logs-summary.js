// How much of each Logging v2 signal has actually been captured so far? Read-only; prints counts and coverage, no personal text.
// Run: npm run logs:summary
import mongoose from "mongoose";
import { config } from "../../src/config.js";
import { ProblemEvent } from "../../src/models/ProblemEvent.js";
import { RecommendationEvent } from "../../src/models/RecommendationEvent.js";
import { Submission } from "../../src/models/Submission.js";
import { LearnerActivity } from "../../src/models/LearnerActivity.js";

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
const subs = await Submission.countDocuments();
const v2 = await Submission.countDocuments({ loggingVersion: "log-2" });
const pct = (n, d) => (d ? `${n} (${Math.round((100 * n) / d)}%)` : "0");
console.log(`submissions: ${subs} total, ${v2} written by Logging v2`);
if (v2) {
  const base = { loggingVersion: "log-2" };
  console.log(`  with a work pattern (activity):   ${pct(await Submission.countDocuments({ ...base, activity: { $ne: null } }), v2)}`);
  console.log(`  with code statistics:             ${pct(await Submission.countDocuments({ ...base, codeStats: { $ne: null } }), v2)}`);
  console.log(`  with a closest-approach label:    ${pct(await Submission.countDocuments({ ...base, approach: { $ne: null } }), v2)}`);
  console.log(`  with a known open source:         ${pct(await Submission.countDocuments({ ...base, openSource: { $ne: null } }), v2)}`);
  console.log(`  that crashed or failed to compile: ${pct(await Submission.countDocuments({ ...base, errorFamily: { $ne: null } }), v2)}`);
  const fam = await Submission.aggregate([{ $match: { ...base, errorFamily: { $ne: null } } }, { $group: { _id: "$errorFamily", n: { $sum: 1 } } }, { $sort: { n: -1 } }]);
  if (fam.length) console.log("  error families:", fam.map((f) => `${f._id}=${f.n}`).join(", "));
}
const recs = await RecommendationEvent.countDocuments({ done: false });
console.log(`recommendations: ${recs} logged, ${await RecommendationEvent.countDocuments({ explored: true })} of them variety picks`);
const kinds = await ProblemEvent.aggregate([{ $group: { _id: "$kind", n: { $sum: 1 } } }, { $sort: { n: -1 } }]);
console.log("learner events:", kinds.length ? kinds.map((k) => `${k._id}=${k.n}`).join(", ") : "none yet");
console.log(`learners with a session row: ${await LearnerActivity.countDocuments()}`);
await mongoose.disconnect();
