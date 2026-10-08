// Removes test accounts (email ending in @example.test) and all their data, e.g. after a test run crashed.
// Real accounts are never touched. Run: npm run cleanup:tests
import mongoose from "mongoose";
import { config } from "../src/config.js";
import { eraseLearnerData } from "../src/erase.js";
import { ConsentEvent } from "../src/models/ConsentEvent.js";
import { Session } from "../src/models/Session.js";
import { User } from "../src/models/User.js";

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
const testUsers = await User.find({ email: /@example\.test$/ }).lean();
for (const u of testUsers) {
  await eraseLearnerData(u.learnerId);
  await Session.deleteMany({ userId: u._id });
  await ConsentEvent.deleteMany({ userId: u._id });
  await User.deleteOne({ _id: u._id });
}
console.log(`removed ${testUsers.length} test account(s) and their data`);
await mongoose.disconnect();
