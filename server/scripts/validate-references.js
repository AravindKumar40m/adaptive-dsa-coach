// Runs every reference solution (all 4 languages) through the REAL grader (harness + Judge0) against the stored tests.
// Proves (a) the expected outputs are right, (b) the harness works in every language, (c) the sandbox works.
// Exit code 1 if anything fails.   Run: npm run content:validate
import mongoose from "mongoose";
import { config } from "../src/config.js";
import { gradeCode } from "../src/grader.js";
import { Problem } from "../src/models/Problem.js";
import { TestCase } from "../src/models/TestCase.js";
import { ReferenceSolution } from "../src/models/ReferenceSolution.js";

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
let failures = 0;
let runs = 0;

// optional filter: node scripts/validate-references.js slug1,slug2   (default: every problem)
const only = process.argv[2] ? new Set(process.argv[2].split(",")) : null;
for (const problem of await Problem.find(only ? { slug: { $in: [...only] } } : {}).sort({ slug: 1 }).lean()) {
  const allTests = await TestCase.find({ problem: problem.slug }).sort({ idx: 1 }).lean();
  const refs = await ReferenceSolution.find({ problem: problem.slug }).lean();
  for (const ref of refs.sort((a, b) => a.language.localeCompare(b.language) || a.approach.localeCompare(b.approach))) {
    const tests = ref.testIdx?.length ? allTests.filter((t) => ref.testIdx.includes(t.idx)) : allTests;
    const r = await gradeCode({ language: ref.language, code: ref.code, signature: problem.signature, tests });
    runs++;
    const passed = r.tests.filter((t) => t.verdict === "passed").length;
    let verdict;
    if (r.verdict === "accepted") verdict = `PASS ${passed}/${tests.length} (${r.timeSec}s)`;
    else if (r.verdict === "time_limit" && ref.expectSlow) verdict = "TLE (allowed: slow on purpose)";
    else {
      failures++;
      verdict = `FAIL ${r.verdict} ${passed}/${tests.length} ${(r.compileOutput || r.stderr || "").slice(0, 200).replace(/\n/g, " ")}`;
    }
    console.log(`${problem.slug.padEnd(18)} ${ref.language.padEnd(11)} ${ref.approach.padEnd(8)} ${verdict}`);
  }
}

console.log(failures === 0 ? `\nAll ${runs} reference solutions verified (4 languages) through the real harness + Judge0.` : `\n${failures} FAILURE(S) out of ${runs} runs`);
await mongoose.disconnect();
process.exit(failures === 0 ? 0 : 1);
