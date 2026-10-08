// Owner-run password reset (there is no email service yet, so there is no "forgot password" link).
// Sets a random temporary password, prints it once and logs the person out everywhere.
// Tell the learner the temporary password through a channel you trust. Run: npm run reset-password -- someone@example.com
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { hashPassword } from "../src/auth.js";
import { config } from "../src/config.js";
import { Session } from "../src/models/Session.js";
import { User } from "../src/models/User.js";

const email = String(process.argv[2] ?? "").trim().toLowerCase();
if (!email) { console.error("Usage: npm run reset-password -- <email>"); process.exit(1); }
await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
const user = await User.findOne({ email });
if (!user) { console.error("No account with that email."); await mongoose.disconnect(); process.exit(1); }
const temporary = randomBytes(9).toString("base64url"); // 12 characters
await User.updateOne({ _id: user._id }, { $set: { passwordHash: await hashPassword(temporary) } });
const { deletedCount } = await Session.deleteMany({ userId: user._id });
console.log(`Temporary password for ${email}: ${temporary}`);
console.log(`${deletedCount} existing login(s) ended. Ask them to log in and (when a change-password screen exists) change it.`);
await mongoose.disconnect();
