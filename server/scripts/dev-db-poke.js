// Developer helper for manual/browser tests of test accounts only (email ending @example.test).
//   node scripts/dev-db-poke.js old-consent <email>   -> pretend the consent wording changed since they agreed
//   node scripts/dev-db-poke.js drop-sessions <email> -> pretend their login expired on the server
import mongoose from "mongoose";
import { config } from "../src/config.js";
import { Session } from "../src/models/Session.js";
import { User } from "../src/models/User.js";

const [action, email] = process.argv.slice(2);
if (!email?.endsWith("@example.test")) { console.error("Only test accounts (@example.test) may be changed."); process.exit(1); }
await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
const user = await User.findOne({ email });
if (!user) { console.error("No such test account."); process.exit(1); }
if (action === "old-consent") await User.updateOne({ _id: user._id }, { $set: { "consent.recording.version": "old-version" } });
else if (action === "drop-sessions") await Session.deleteMany({ userId: user._id });
else { console.error("Unknown action."); process.exit(1); }
console.log(`${action} done for ${email}`);
await mongoose.disconnect();
