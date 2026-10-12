// The failing hidden test shown after a failed Submit, end to end through real accounts and Judge0.
// The scenario: a Run passes the visible examples, the Submit then fails some hidden tests. Starts its own API copy on port 4119
// (your dev server is not touched). Test accounts end in @example.test and are removed afterwards.   Run: npm run test:reveal-flow
import { spawn } from "node:child_process";
import mongoose from "mongoose";
import { config } from "../../src/config.js";
import { ProblemDifficulty } from "../../src/models/ProblemDifficulty.js";
import { ReferenceSolution } from "../../src/models/ReferenceSolution.js";
import { Submission } from "../../src/models/Submission.js";
import { TestCase } from "../../src/models/TestCase.js";
import { newUser } from "../lib/client.js";

let failures = 0;
const check = (ok, label, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (url) => { for (let i = 0; i < 40; i++) { try { if ((await fetch(url)).status > 0) return; } catch { await sleep(250); } } };

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
const api = spawn(process.execPath, ["src/index.js"], { env: { ...process.env, PORT: "4119", PICKER_EXPLORE_RATE: "0" }, stdio: ["ignore", "ignore", "pipe"] });
const base = "http://localhost:4119/api";
const users = [];
const learner = async () => { const u = await newUser(base); users.push(u); return u; };
const started = () => new Date(Date.now() - 60000).toISOString();
const SLUG = "peak-altitude";
const all = (await TestCase.find({ problem: SLUG }).sort({ idx: 1 }).lean());
const visible = all.filter((t) => t.visible), hidden = all.filter((t) => !t.visible);
const key = (a) => JSON.stringify(a[0]);
// a "cheating" function that knows the visible examples only: right on them, 0 anywhere else, so it fails exactly the hidden tests whose answer is not 0
const table = Object.fromEntries(visible.map((t) => [key(t.args), t.expected]));
const pyTable = JSON.stringify(table);
const failingHidden = hidden.filter((t) => t.expected !== 0);
const smallest = [...failingHidden].sort((a, b) => JSON.stringify(a.args).length - JSON.stringify(b.args).length || a.idx - b.idx)[0];
const PY_WRONG = `import json\n_T = json.loads('${pyTable}')\ndef peak_altitude(changes):\n    return _T.get(json.dumps(changes, separators=(",", ":")), 0)\n`;
const PY_CRASH = PY_WRONG.replace("_T.get(json.dumps(changes, separators=(\",\", \":\")), 0)", "_T[json.dumps(changes, separators=(\",\", \":\"))]");
const PY_HANG = PY_WRONG.replace("    return _T.get(json.dumps(changes, separators=(\",\", \":\")), 0)", "    k = json.dumps(changes, separators=(\",\", \":\"))\n    if k in _T:\n        return _T[k]\n    while True:\n        pass");
const sub = (u, language, code) => u.post("/submit", { problem: SLUG, language, code, startedAt: started() });

try {
  await ProblemDifficulty.deleteMany({});
  await waitFor(`${base}/health`);
  check(visible.length === 2 && hidden.length === 19 && failingHidden.length >= 5, "setup: peak-altitude has 2 visible examples and 19 hidden tests, and several hidden tests have a non-zero answer", `(${failingHidden.length} would fail)`);
  const a = await learner();

  // ---------------------------------------------------------------- the scenario: Run passes, Submit fails on hidden tests
  const run = (await a.post("/run", { problem: SLUG, language: "python", code: PY_WRONG, startedAt: started() })).json;
  check(run.verdict === "accepted" && run.passed === 2 && run.total === 2, "a Run passes both visible examples (2 of 2)");
  check(run.hiddenFailure === null, "a Run never shows a hidden test");
  const r = (await sub(a, "python", PY_WRONG)).json;
  check(r.verdict === "wrong_answer" && r.passed === 2 + (hidden.length - failingHidden.length) && r.total === 21, "the Submit then fails: wrong answer, only the examples (and any answer-0 tests) pass", `(${r.passed} of ${r.total})`);
  const f = r.hiddenFailure;
  check(f && JSON.stringify(f.args) === JSON.stringify(smallest.args) && f.expected === smallest.expected && f.actual === 0 && f.verdict === "wrong_answer", "ONE hidden test is shown: the smallest failing input, its expected output and what the code returned", JSON.stringify(f));
  check(f.kind === smallest.kind && f.of === 19 && f.ordinal === hidden.findIndex((t) => t.idx === smallest.idx) + 1, "with its kind and its place among the 19 hidden tests (hidden test " + f?.ordinal + " of " + f?.of + ")");
  check(!("idx" in f) && JSON.stringify(Object.keys(f).sort()) === JSON.stringify(["actual", "args", "expected", "kind", "of", "ordinal", "verdict"]), "the response never carries the test's internal number", JSON.stringify(Object.keys(f).sort()));
  const entries = r.tests.filter((t) => !t.visible);
  check(entries.length === 19 && entries.every((t) => !("args" in t) && !("expected" in t) && !("actual" in t)), "the list of hidden tests itself still shows only pass or fail (no other input leaks)");
  const others = failingHidden.filter((t) => t.idx !== smallest.idx).map((t) => JSON.stringify(t.args));
  const body = JSON.stringify(r);
  check(others.every((o) => body.split(o).length - 1 <= (JSON.stringify(smallest.args) === o ? 1 : 0)), "no other failing hidden input appears anywhere in the response");
  const row = await Submission.findOne({ learnerId: a.learnerId, mode: "submit" }).lean();
  check(row.revealedTest?.idx === smallest.idx && row.revealedTest.kind === smallest.kind && row.revealedTest.verdict === "wrong_answer", "the Submit's log row records which hidden test was shown");

  // ---------------------------------------------------------------- a crash and a time limit
  const c = (await sub(a, "python", PY_CRASH)).json;
  check(c.verdict === "runtime_error" && c.hiddenFailure?.verdict === "runtime_error" && /^ERR:KeyError/.test(c.hiddenFailure.actual) && JSON.stringify(c.hiddenFailure.args) === JSON.stringify(hidden.slice().sort((x, y) => JSON.stringify(x.args).length - JSON.stringify(y.args).length || x.idx - y.idx)[0].args), "a crash on hidden inputs: the smallest hidden input is shown with the error name as the output", JSON.stringify(c.hiddenFailure?.actual));
  const t0 = Date.now();
  const h = (await sub(a, "python", PY_HANG)).json;
  check(h.verdict === "time_limit" && h.hiddenFailure?.verdict === "time_limit" && h.hiddenFailure.actual === null && h.hiddenFailure.expected !== undefined, "a solution that hangs on the first hidden input: that test is shown (expected output, no answer in time)", `(${Math.round((Date.now() - t0) / 1000)} s)`);
  const tl = hidden[0];
  check(JSON.stringify(h.hiddenFailure.args) === JSON.stringify(tl.args), "it is the test the program was stuck on, not a test that never ran");

  // ---------------------------------------------------------------- other languages
  const jsWrong = `const T = ${JSON.stringify(table)};\nfunction peakAltitude(changes) { const k = JSON.stringify(changes); return k in T ? T[k] : 0; }\n`;
  const j = (await sub(a, "javascript", jsWrong)).json;
  check(j.verdict === "wrong_answer" && JSON.stringify(j.hiddenFailure?.args) === JSON.stringify(smallest.args) && j.hiddenFailure.expected === smallest.expected && j.hiddenFailure.actual === 0, "JavaScript: the same hidden test is shown, with the answer as a plain number", JSON.stringify(j.hiddenFailure?.actual));
  const cppRows = Object.entries(table).map(([k, v]) => `    if (changes == std::vector<int>${JSON.stringify(JSON.parse(k)).replace("[", "{").replace("]", "}")}) return ${v};`).join("\n");
  const cpp = (await sub(a, "cpp", `#include <vector>\nint peak_altitude(std::vector<int>& changes) {\n${cppRows}\n    return 0;\n}\n`)).json;
  check(cpp.verdict === "wrong_answer" && JSON.stringify(cpp.hiddenFailure?.args) === JSON.stringify(smallest.args) && cpp.hiddenFailure.actual === 0, "C++: the same hidden test is shown", JSON.stringify(cpp.hiddenFailure));

  // ---------------------------------------------------------------- when nothing is shown
  const solution = (await ReferenceSolution.findOne({ problem: SLUG, language: "python", approach: "optimal" }).lean()).code;
  const ok = (await sub(a, "python", solution)).json;
  check(ok.verdict === "accepted" && ok.hiddenFailure === null, "an accepted solution: nothing is shown");
  const ce = (await sub(a, "python", "def peak_altitude(changes)\n    return 1\n")).json;
  check(ce.verdict === "compile_error" && ce.hiddenFailure === null, "a compile error: nothing is shown");
  const rows = await Submission.find({ learnerId: a.learnerId, mode: "submit", verdict: "accepted" }).lean();
  check(rows.every((x) => x.revealedTest == null), "nothing is logged as shown for an accepted Submit");

  // ---------------------------------------------------------------- scoring is unchanged: the revealed case is not 'help'
  const b = await learner();
  const before = (await sub(b, "python", PY_WRONG)).json;
  const fixed = (await sub(b, "python", solution)).json;
  check(before.skill?.counted === true && fixed.skill?.components?.independence === 1 && fixed.skill.hintLevel === 0, "seeing a failing hidden test does not count as help: the fix still gets full independence (hint level 0)", JSON.stringify(fixed.skill?.components));
} finally {
  for (const u of users) await u.deleteAccount().catch(() => {});
  api.kill();
  await ProblemDifficulty.deleteMany({});
  await mongoose.disconnect();
}
console.log(failures === 0 ? "\nALL REVEAL-FLOW CHECKS PASSED" : `\n${failures} REVEAL-FLOW CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
