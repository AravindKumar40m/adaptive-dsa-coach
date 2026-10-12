// Loads the complexity analyzer's size generators (content/build/complexity.json, made by content/build_complexity.py) into MongoDB.
// Safe to re-run: it replaces the configs and never touches learner data (finished measurements keep their results).
// Run: npm run content:complexity   (builds and checks first, then loads)
import fs from "node:fs";
import mongoose from "mongoose";
import { config } from "../../src/config.js";
import { ComplexityConfig } from "../../src/models/ComplexityConfig.js";

const built = JSON.parse(fs.readFileSync(new URL("../../content/build/complexity.json", import.meta.url), "utf8"));

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
await ComplexityConfig.deleteMany({});
await ComplexityConfig.insertMany(Object.entries(built.configs).map(([problem, c]) => ({ problem, ...c, configVersion: built.version })));
console.log(`seeded: ${await ComplexityConfig.countDocuments()} complexity configs (${built.version})`);
await mongoose.disconnect();
