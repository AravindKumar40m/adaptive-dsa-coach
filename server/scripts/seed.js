// Loads content/build/content.json into MongoDB. Safe to re-run (replaces content, never touches learner data).
// Run: npm run content:seed
import fs from "node:fs";
import mongoose from "mongoose";
import { config } from "../src/config.js";
import { Concept } from "../src/models/Concept.js";
import { Problem } from "../src/models/Problem.js";
import { TestCase } from "../src/models/TestCase.js";
import { ReferenceSolution } from "../src/models/ReferenceSolution.js";

const content = JSON.parse(fs.readFileSync(new URL("../content/build/content.json", import.meta.url), "utf8"));

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });

await Concept.deleteMany({});
await Concept.insertMany(content.concepts);
await Problem.deleteMany({});
await Problem.insertMany(content.problems);
await TestCase.deleteMany({});
await TestCase.insertMany(content.testCases.map(({ kind, visible, args, expected, idx, problem }) => ({ problem, idx, kind, visible, args, expected })));
await ReferenceSolution.deleteMany({});
await ReferenceSolution.insertMany(content.referenceSolutions);

console.log(
  `seeded: ${await Concept.countDocuments()} concepts, ${await Problem.countDocuments()} problems, ` +
    `${await TestCase.countDocuments()} tests, ${await ReferenceSolution.countDocuments()} reference solutions`
);
await mongoose.disconnect();
