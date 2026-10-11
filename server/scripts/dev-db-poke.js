// Developer helper for manual/browser tests of TEST accounts only (email ending @example.test).
//   node scripts/dev-db-poke.js old-consent <email>   -> pretend the consent wording changed since they agreed
//   node scripts/dev-db-poke.js drop-sessions <email> -> pretend their login expired on the server
//   node scripts/dev-db-poke.js inspect <email>       -> print what Logging v2 recorded for them (JSON)
//   node scripts/dev-db-poke.js solution <email> <slug> -> print that problem's stored optimal Python solution
import mongoose from "mongoose";
import { config } from "../src/config.js";
import { KnowledgeState } from "../src/models/KnowledgeState.js";
import { PlacementSurvey } from "../src/models/PlacementSurvey.js";
import { ProblemEvent } from "../src/models/ProblemEvent.js";
import { ReferenceSolution } from "../src/models/ReferenceSolution.js";
import { RecommendationEvent } from "../src/models/RecommendationEvent.js";
import { Session } from "../src/models/Session.js";
import { Submission } from "../src/models/Submission.js";
import { User } from "../src/models/User.js";

const [action, email, extra] = process.argv.slice(2);
if (!email?.endsWith("@example.test")) { console.error("Only test accounts (@example.test) may be changed."); process.exit(1); }
await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
const user = await User.findOne({ email });
if (!user) { console.error("No such test account."); process.exit(1); }
if (action === "old-consent") await User.updateOne({ _id: user._id }, { $set: { "consent.recording.version": "old-version" } });
else if (action === "drop-sessions") await Session.deleteMany({ userId: user._id });
else if (action === "inspect") {
  const id = user.learnerId;
  const events = await ProblemEvent.find({ learnerId: id }).sort({ createdAt: 1 }).lean();
  const recs = await RecommendationEvent.find({ learnerId: id }).sort({ createdAt: 1 }).lean();
  const subs = await Submission.find({ learnerId: id }).sort({ createdAt: 1 }).lean();
  console.log(JSON.stringify({
    consentVersion: user.consent?.recording?.version,
    survey: await PlacementSurvey.findOne({ learnerId: id }).select('answers experience -_id').lean(),
    startingGuesses: Object.fromEntries(Object.entries((await KnowledgeState.findOne({ learnerId: id }).lean())?.skills ?? {}).map(([k, v]) => [k, Math.round(v.theta)])),
    events: events.map((e) => ({ kind: e.kind, value: e.value, problem: e.problem, linkedToRecommendation: Boolean(e.recommendationId), session: Boolean(e.sessionId) })),
    recommendations: recs.map((r) => ({ chosen: r.chosen?.slug, explored: r.explored, propensity: r.propensity, candidates: r.candidates?.length, picker: r.pickerVersion })),
    submissions: subs.map((s) => ({ problem: s.problem, mode: s.mode, verdict: s.verdict, openSource: s.openSource, linkedToRecommendation: Boolean(s.recommendationId), errorFamily: s.errorFamily, approach: s.approach?.closest, activity: s.activity })),
  }));
} else if (action === "solution") { // the stored optimal Python solution of a problem, so a browser test can solve whatever was recommended
  const ref = await ReferenceSolution.findOne({ problem: extra, language: "python", approach: "optimal" }).lean();
  process.stdout.write(ref?.code ?? "");
}
else { console.error("Unknown action."); process.exit(1); }
if (action !== "inspect" && action !== "solution") console.log(`${action} done for ${email}`);
await mongoose.disconnect();
