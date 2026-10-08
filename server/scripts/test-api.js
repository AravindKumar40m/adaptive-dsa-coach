// HTTP-level test of the run/submit API, now through a real (temporary) account. The API server must be running (npm run dev).
// Run: npm run test:api
import mongoose from "mongoose";
import { config } from "../src/config.js";
import { Submission } from "../src/models/Submission.js";
import { newUser } from "./lib/client.js";

const base = `http://localhost:${config.port}/api`;
let failures = 0;
const check = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`);
};

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
const u = await newUser(base);
try {
  // problems are public; starter code comes from the API
  const detail = (await (await fetch(`${base}/problems/peak-altitude`)).json());
  check(Object.keys(detail.starters).sort().join() === "cpp,java,javascript,python", "problem detail has 4 starters");
  check(!("hints" in detail) && !("testCases" in detail), "detail hides hints and tests");

  const good = "def peak_altitude(changes):\n    best = h = 0\n    for c in changes:\n        h += c\n        best = max(best, h)\n    return best\n";
  const stub = detail.starters.python; // the untouched starter returns None
  const body = (code, extra = {}) => ({ problem: "peak-altitude", language: "python", code, ...extra });

  let r = await u.post("/run", body(good));
  check(r.status === 200 && r.json.verdict === "accepted" && r.json.total === 2, "run: good code accepted on 2 visible tests", `(${r.json.passed}/${r.json.total})`);
  check(r.json.tests.every((t) => t.visible && t.args && "expected" in t), "run: visible tests show args and expected");

  r = await u.post("/submit", body(good));
  check(r.json.verdict === "accepted" && r.json.total === 21 && r.json.passed === 21, "submit: good code passes all 21 tests", `(${r.json.passed}/${r.json.total})`);
  const hidden = r.json.tests.filter((t) => !t.visible);
  check(hidden.length === 19 && hidden.every((t) => !("args" in t) && !("expected" in t) && !("actual" in t)), "submit: hidden tests reveal only pass/fail");

  r = await u.post("/submit", body(stub));
  check(r.json.verdict === "runtime_error" || r.json.verdict === "wrong_answer", "submit: untouched starter is not accepted", `(${r.json.verdict})`);

  r = await u.post("/run", body(good, { language: "cobol" }));
  check(r.status === 400, "rejects unknown language", `(${r.status})`);
  r = await u.post("/run", body(good, { learnerId: "00000000-0000-0000-0000-000000000000" }));
  check(r.status === 403, "rejects a learnerId that is not yours", `(${r.status})`);
  r = await u.post("/run", body("   "));
  check(r.status === 400, "rejects empty code", `(${r.status})`);
  r = await u.post("/run", body("x".repeat(20001)));
  check(r.status === 400, "rejects code over 20000 characters", `(${r.status})`);
  r = await u.post("/run", body(good, { problem: "no-such-problem" }));
  check(r.status === 404, "unknown problem is 404", `(${r.status})`);

  // logging: every accepted request (run or submit) must be stored, with the code, under THIS learner
  const logged = await Submission.find({ learnerId: u.learnerId }).sort({ createdAt: 1 }).lean();
  check(logged.length === 3, "3 graded requests were logged", `(found ${logged.length})`);
  check(logged[0].mode === "run" && logged[1].mode === "submit" && logged[0].code === good && logged[1].perTest.length === 21, "log has mode, full code and per-test results");

  // data deletion keeps the account
  const del = await u.del(`/learners/${u.learnerId}/data`);
  check(del.json.deleted === 3, "delete my data removes all 3 rows", `(deleted ${del.json.deleted})`);
  check((await Submission.countDocuments({ learnerId: u.learnerId })) === 0, "nothing left for that learner");
  check((await u.get("/auth/me")).status === 200, "the account itself is still there after deleting the learning data");
} finally {
  await u.deleteAccount();
}
console.log(failures === 0 ? "\nAll API checks passed." : `\n${failures} CHECK(S) FAILED`);
await mongoose.disconnect();
process.exit(failures === 0 ? 0 : 1);
