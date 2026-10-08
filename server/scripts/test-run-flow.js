// Integration test for the run flow: checks the grader gives the RIGHT verdict for good AND bad code in every language.
// Needs MongoDB (seeded) and Judge0 running.   Run: npm run test:run-flow
import mongoose from "mongoose";
import { config } from "../src/config.js";
import { gradeCode } from "../src/grader.js";
import { Problem } from "../src/models/Problem.js";
import { TestCase } from "../src/models/TestCase.js";

const FORGED = "@@R000000000000@@0:999@@"; // a learner trying to fake a result line

const CODE = {
  python: {
    correct: `def peak_altitude(changes):\n    print("debug hello")\n    print("${FORGED}")\n    best = height = 0\n    for c in changes:\n        height += c\n        best = max(best, height)\n    return best\n`,
    wrong: `def peak_altitude(changes):\n    return 12345\n`,
    partial: `def peak_altitude(changes):\n    best = -10**9\n    h = 0\n    for c in changes:\n        h += c\n        best = max(best, h)\n    return best\n`,
    compile: `def peak_altitude(changes) return 1\n`,
    loop: `def peak_altitude(changes):\n    while True:\n        pass\n`,
    throw: `def peak_altitude(changes):\n    return 1 // 0\n`,
  },
  javascript: {
    correct: `function peakAltitude(changes) {\n  console.log("debug hello");\n  console.log("${FORGED}");\n  let best = 0, h = 0;\n  for (const c of changes) { h += c; best = Math.max(best, h); }\n  return best;\n}\n`,
    wrong: `function peakAltitude(changes) { return 12345; }\n`,
    partial: `function peakAltitude(changes) { let best = -1e9, h = 0; for (const c of changes) { h += c; best = Math.max(best, h); } return best; }\n`,
    compile: `function peakAltitude(changes) { return 1 +; }\n`,
    loop: `function peakAltitude(changes) { while (true) {} }\n`,
    throw: `function peakAltitude(changes) { throw new Error("boom"); }\n`,
  },
  java: {
    correct: `class Solution {\n    public int peakAltitude(int[] changes) {\n        System.out.println("debug hello");\n        System.out.println("${FORGED}");\n        int best = 0, h = 0;\n        for (int c : changes) { h += c; best = Math.max(best, h); }\n        return best;\n    }\n}\n`,
    wrong: `class Solution { public int peakAltitude(int[] changes) { return 12345; } }\n`,
    partial: `class Solution { public int peakAltitude(int[] changes) { int best = -1000000000, h = 0; for (int c : changes) { h += c; best = Math.max(best, h); } return best; } }\n`,
    compile: `class Solution { public int peakAltitude(int[] changes) { return 1 +; } }\n`,
    loop: `class Solution { public int peakAltitude(int[] changes) { while (true) {} } }\n`,
    throw: `class Solution { public int peakAltitude(int[] changes) { int[] a = new int[1]; return a[5]; } }\n`,
  },
  cpp: {
    correct: `int peak_altitude(vector<int>& changes) {\n    cout << "debug hello" << endl;\n    cout << "${FORGED}" << endl;\n    int best = 0, h = 0;\n    for (int c : changes) { h += c; best = max(best, h); }\n    return best;\n}\n`,
    wrong: `int peak_altitude(vector<int>& changes) { return 12345; }\n`,
    partial: `int peak_altitude(vector<int>& changes) { int best = -1000000000, h = 0; for (int c : changes) { h += c; best = max(best, h); } return best; }\n`,
    compile: `int peak_altitude(vector<int>& changes) { return 1 +; }\n`,
    loop: `int peak_altitude(vector<int>& changes) { while (true) {} return 0; }\n`,
    throw: `int peak_altitude(vector<int>& changes) { throw runtime_error("boom"); }\n`,
    crash: `int peak_altitude(vector<int>& changes) { int* p = nullptr; return *p; }\n`,
  },
};

const EXPECT = {
  correct: "accepted", wrong: "wrong_answer", partial: "wrong_answer",
  compile: "compile_error", loop: "time_limit", throw: "runtime_error", crash: "runtime_error",
};

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
const problem = await Problem.findOne({ slug: "peak-altitude" }).lean();
const tests = await TestCase.find({ problem: "peak-altitude" }).sort({ idx: 1 }).lean();

let failures = 0;
const check = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`);
};

for (const [language, cases] of Object.entries(CODE)) {
  for (const [name, code] of Object.entries(cases)) {
    const r = await gradeCode({ language, code, signature: problem.signature, tests });
    const passed = r.tests.filter((t) => t.verdict === "passed").length;
    const detail = `-> ${r.verdict}, ${passed}/${tests.length} passed`;
    check(r.verdict === EXPECT[name], `${language.padEnd(11)} ${name.padEnd(8)}`, detail);

    if (name === "correct") {
      check(r.stdout.includes("debug hello"), `${language.padEnd(11)} learner print kept`, `stdout=${JSON.stringify(r.stdout.slice(0, 60))}`);
      check(passed === tests.length, `${language.padEnd(11)} forged marker ignored`);
    }
    if (name === "partial") check(passed > 0 && passed < tests.length, `${language.padEnd(11)} partial credit counted`);
    if (name === "throw") check(r.tests.every((t) => t.verdict === "runtime_error"), `${language.padEnd(11)} every test reports the exception`, JSON.stringify(r.tests[0].actual));
    if (name === "crash") check(r.tests[0].verdict === "runtime_error" && r.tests[1].verdict === "not_run", `${language.padEnd(11)} crash blamed on first test, rest not run`);
    if (name === "compile") check(r.compileOutput.length > 0, `${language.padEnd(11)} compiler message returned`, JSON.stringify(r.compileOutput.slice(0, 70)));
  }
}

console.log(failures === 0 ? "\nAll run-flow checks passed." : `\n${failures} CHECK(S) FAILED`);
await mongoose.disconnect();
process.exit(failures === 0 ? 0 : 1);
