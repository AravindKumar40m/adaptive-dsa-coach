// Loads the placement quiz questions (content/build/placement.json, made by content/build_placement.py) into MongoDB.
// Safe to re-run: it replaces the questions and never touches learner data (finished quizzes keep their answers).
// Run: npm run content:placement   (builds first, then loads)
import fs from "node:fs";
import mongoose from "mongoose";
import { config } from "../../src/config.js";
import { PlacementItem } from "../../src/models/PlacementItem.js";

const bank = JSON.parse(fs.readFileSync(new URL("../../content/build/placement.json", import.meta.url), "utf8"));

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
await PlacementItem.deleteMany({});
await PlacementItem.insertMany(bank.items.map((i) => ({ ...i, bankVersion: bank.version })));
console.log(`seeded: ${await PlacementItem.countDocuments()} placement questions (${bank.version})`);
await mongoose.disconnect();
