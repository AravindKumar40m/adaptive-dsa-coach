// Counts recorded rows whose learnerId belongs to no account (data from before accounts existed). Read-only.
// Run: npm run orphans
import mongoose from "mongoose";
import { config } from "../src/config.js";
import { User } from "../src/models/User.js";

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
const owned = (await User.find({}, "learnerId").lean()).map((u) => u.learnerId);
console.log(`accounts: ${owned.length}`);
for (const name of ["submissions", "skillratings", "ratingupdates", "hintevents"]) {
  const col = mongoose.connection.collection(name);
  const ids = (await col.distinct("learnerId")).filter((id) => !owned.includes(id));
  const rows = ids.length ? await col.countDocuments({ learnerId: { $in: ids } }) : 0;
  console.log(`${name.padEnd(14)} ${String(rows).padStart(4)} row(s) from ${ids.length} learner id(s) with no account`);
}
await mongoose.disconnect();
