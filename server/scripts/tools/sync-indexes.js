// Creates every index the models declare (unique emails, session expiry, lookups) in the database from .env.
// The API does this by itself when it starts; run this when the database was emptied or recreated while the API kept running.
// Changes no documents. Run: npm run db:indexes
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import mongoose from "mongoose";
import { config } from "../../src/config.js";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../src/models");
for (const f of fs.readdirSync(dir)) if (f.endsWith(".js")) await import(pathToFileURL(path.join(dir, f)).href);

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
for (const name of mongoose.modelNames()) await mongoose.model(name).syncIndexes();
const users = await mongoose.connection.db.collection("users").indexes();
const sessions = await mongoose.connection.db.collection("sessions").indexes();
console.log(`database ${mongoose.connection.name}: indexes built for ${mongoose.modelNames().length} models`);
console.log("users:", users.map((i) => i.name + (i.unique ? " (unique)" : "")).join(", "));
console.log("sessions:", sessions.map((i) => i.name + (i.expireAfterSeconds !== undefined ? " (expires by itself)" : "")).join(", "));
await mongoose.disconnect();
