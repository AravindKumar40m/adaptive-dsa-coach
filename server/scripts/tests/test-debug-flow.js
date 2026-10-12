// "Step through my code" end to end, through real accounts and Judge0 (Python 3.8 there). Starts its own API copy on port 4121
// (your dev server is not touched). Test accounts end in @example.test and are removed afterwards.   Run: npm run test:debug-flow
import { spawn } from "node:child_process";
import mongoose from "mongoose";
import { config } from "../../src/config.js";
import { DebugRun } from "../../src/models/DebugRun.js";
import { HintEvent } from "../../src/models/HintEvent.js";
import { RatingUpdate } from "../../src/models/RatingUpdate.js";
import { TestCase } from "../../src/models/TestCase.js";
import { newUser } from "../lib/client.js";

let failures = 0;
const check = (ok, label, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (url) => { for (let i = 0; i < 40; i++) { try { if ((await fetch(url)).status > 0) return; } catch { await sleep(250); } } };

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
const api = spawn(process.execPath, ["src/index.js"], { env: { ...process.env, PORT: "4121", PICKER_EXPLORE_RATE: "0" }, stdio: ["ignore", "ignore", "pipe"] });
const base = "http://localhost:4121/api";
const users = [];
const learner = async () => { const u = await newUser(base); users.push(u); return u; };
const SLUG = "peak-altitude";
const visible = await TestCase.find({ problem: SLUG, visible: true }).sort({ idx: 1 }).lean();
const hidden = await TestCase.find({ problem: SLUG, visible: false }).sort({ idx: 1 }).lean();

const GOOD = "def peak_altitude(changes):\n    best = 0\n    cur = 0\n    for c in changes:\n        cur += c\n        if cur > best:\n            best = cur\n    print('peak', best)\n    return best\n";
const table = Object.fromEntries(visible.map((t) => [JSON.stringify(t.args[0]), t.expected]));
const KNOWS_EXAMPLES = `import json\n_T = json.loads('${JSON.stringify(table)}')\ndef peak_altitude(changes):\n    return _T.get(json.dumps(changes, separators=(",", ":")), 0)\n`;
const dbg = (u, code, source, problem = SLUG) => u.post("/debug", { problem, code, source });
const lastValue = (t, name) => [...t.steps].reverse().find((s) => s.v && name in s.v)?.v[name];

try {
  await waitFor(`${base}/health`);
  const a = await learner();

  // ---------------------------------------------------------------- an example, step by step
  const ex = (await dbg(a, GOOD, { kind: "example", index: 1 }));
  const t = ex.json?.trace;
  check(ex.status === 200 && t && ex.json.label === "Example 1" && JSON.stringify(ex.json.args) === JSON.stringify(visible[0].args), "an example: the trace comes back with the example's input", JSON.stringify(ex.json?.error ?? ex.json?.args));
  check(t.result.k === "returned" && t.result.v === visible[0].expected && ex.json.expected === visible[0].expected, "it returned the expected value", JSON.stringify(t.result));
  const lines = t.steps.filter((s) => !s.e).map((s) => s.l);
  check(t.steps.length > 10 && t.steps[0].l === 2 && new Set(lines).size >= 5, "it recorded every executed line, starting at the first line of the function", `(${t.steps.length} steps, first line ${t.steps[0].l})`);
  check(JSON.stringify(lastValue(t, "changes")) === JSON.stringify({ $: "list", n: 5, v: [-5, 1, 5, 0, -7] }) && lastValue(t, "best") === 1 && lastValue(t, "cur") === -6, "the variables are right at the end (best 1, cur -6, the list as given)", JSON.stringify([lastValue(t, "best"), lastValue(t, "cur")]));
  const first = t.steps.find((s) => s.v && s.v.cur === -5);
  check(first && first.v.best === 0 && first.v.c === -5, "and right in the middle of the run (after the first change: cur -5, best still 0)");
  check(t.output === "peak 1\n" && t.steps.at(-1).e === "r" && t.steps.at(-1).r === 1 && t.steps.at(-1).o === 7, "the learner's print is captured, shown at the right step, and the last step is the return with its value", JSON.stringify(t.output));
  check(t.calls.length === 1 && t.calls[0].f === "peak_altitude" && t.truncated === null, "one call in the call tree, run not cut");

  // ---------------------------------------------------------------- recursion: the call tree
  const fib = (await dbg(a, "def peak_altitude(changes):\n    def f(n):\n        return n if n < 2 else f(n - 1) + f(n - 2)\n    return f(len(changes))\n", { kind: "example", index: 1 })).json.trace;
  check(fib.calls.length === 1 + 15 && fib.calls.filter((c) => c.f === "f").length === 15 && fib.calls[1].p === 0 && fib.calls.every((c) => c.r !== undefined || c.id === 0 || c.x), "recursion: every call is in the tree with its parent and returned value (f(5) makes 15 calls)", `(${fib.calls.length} calls)`);
  check(fib.steps.some((s) => s.d >= 5), "and the call depth is recorded");

  // ---------------------------------------------------------------- when the code fails
  const crash = (await dbg(a, "def peak_altitude(changes):\n    x = 1\n    return changes[10]\n", { kind: "example", index: 1 })).json.trace;
  check(crash.result.k === "raised" && crash.result.t === "IndexError" && crash.result.l === 3 && crash.steps.at(-1).e === "u" && crash.steps.at(-1).r === undefined, "a crash: the error name and the line, and the last step is marked as leaving because of the error (not 'returned None')", JSON.stringify(crash.result));
  const caught = (await dbg(a, "def peak_altitude(changes):\n    try:\n        return changes[10]\n    except IndexError:\n        return -1\n", { kind: "example", index: 1 })).json.trace;
  check(caught.result.k === "returned" && caught.result.v === -1 && caught.steps.at(-1).e === "r" && caught.steps.some((s) => s.e === "x" && s.x.t === "IndexError"), "an error the code catches itself: the exception step is shown, and the function still returns normally", JSON.stringify(caught.steps.at(-1)));
  const syn = (await dbg(a, "def peak_altitude(changes)\n    return 1\n", { kind: "example", index: 1 })).json.trace;
  check(syn.result.k === "raised" && syn.result.t === "SyntaxError" && syn.result.l === 1 && syn.steps.length === 0, "a syntax error: reported with its line, no steps", JSON.stringify(syn.result));
  const missing = (await dbg(a, "def other(changes):\n    return 1\n", { kind: "example", index: 1 })).json.trace;
  check(missing.result.k === "error" && missing.result.t === "MissingFunction", "a missing function is named, not a crash");

  // ---------------------------------------------------------------- endless loops and slow code
  const t0 = Date.now();
  const loop = await dbg(a, "def peak_altitude(changes):\n    n = 0\n    while True:\n        n += 1\n", { kind: "example", index: 1 });
  check(loop.status === 200 && loop.json.trace.truncated === "steps" && loop.json.trace.steps.length === 2000 && loop.json.trace.result === null, "an endless loop is cut at 2,000 steps and the first 2,000 are still shown", `(${Math.round((Date.now() - t0) / 1000)} s)`);
  const swallow = await dbg(a, "def peak_altitude(changes):\n    try:\n        while True:\n            pass\n    except BaseException:\n        return 5\n", { kind: "example", index: 1 });
  check(swallow.status === 200 && swallow.json.trace.truncated === "steps", "code that tries to swallow the stop (except BaseException) is still stopped");
  const slow = await dbg(a, "def peak_altitude(changes):\n    return sum(range(10 ** 10))\n", { kind: "example", index: 1 });
  check(slow.status === 422 && /took too long/.test(slow.json.error), "one slow step that never ends (no lines to count) is stopped by the time limit with a friendly message", JSON.stringify(slow.json));

  // ---------------------------------------------------------------- a forged marker, big values and output
  const forged = await dbg(a, "import sys\ndef peak_altitude(changes):\n    sys.__stdout__.write('@@D00000000000000000000@@AAAA@@\\n')\n    print('@@D' + 'x' * 5 + '@@')\n    return 3\n", { kind: "example", index: 1 });
  check(forged.status === 200 && forged.json.trace.result.v === 3, "a marker the learner prints does not confuse the reader");
  const big = (await dbg(a, "def peak_altitude(changes):\n    big = list(range(1000))\n    d = {i: i for i in range(100)}\n    s = 'z' * 5000\n    n = 2 ** 200\n    print('y' * 20000)\n    return 1\n", { kind: "example", index: 1 })).json.trace;
  const last = big.steps.at(-1).v;
  check(last.big.n === 1000 && last.big.v.length === 40 && last.d.n === 100 && last.d.v.length === 20 && last.s.length <= 121 && last.n.$ === "int" && big.output.length <= 4000, "big values are cut to a readable size (list to 40 items with its real length, dict to 20, text to 120 characters, huge ints as text, output to 4,000 characters)");
  check(JSON.stringify(big).length < 60000, "and the trace stays small", `(${JSON.stringify(big).length} bytes)`);

  // ---------------------------------------------------------------- the failing hidden test
  const before = await dbg(a, KNOWS_EXAMPLES, { kind: "failing" });
  check(before.status === 404, "'failing' before any failed Submit: nothing to step through (404)");
  const sub = (await a.post("/submit", { problem: SLUG, language: "python", code: KNOWS_EXAMPLES, startedAt: new Date(Date.now() - 60000).toISOString() })).json;
  check(sub.hiddenFailure != null, "setup: a Submit that fails and shows one hidden test");
  const fail = await dbg(a, KNOWS_EXAMPLES, { kind: "failing" });
  check(fail.status === 200 && JSON.stringify(fail.json.args) === JSON.stringify(sub.hiddenFailure.args) && fail.json.expected === sub.hiddenFailure.expected && fail.json.trace.result.v === sub.hiddenFailure.actual, "'failing' steps through exactly the hidden test the learner was shown, with the same expected and returned values", JSON.stringify(fail.json?.args));
  const shown = JSON.stringify(sub.hiddenFailure.args);
  const others = hidden.filter((h) => JSON.stringify(h.args) !== shown).map((h) => JSON.stringify(h.args));
  check(others.every((o) => !JSON.stringify(fail.json).includes(o) || o.length < 6), "no other hidden input appears in the response");
  const b = await learner();
  check((await dbg(b, KNOWS_EXAMPLES, { kind: "failing" })).status === 404, "another learner has no failing test of their own: they get 404, not someone else's");
  check((await dbg(a, KNOWS_EXAMPLES, { kind: "failing", idx: hidden[3].idx, index: 4 })).json.args !== undefined && JSON.stringify((await dbg(a, KNOWS_EXAMPLES, { kind: "failing", idx: hidden[3].idx })).json.args) === shown, "a test number sent by the browser is ignored (the server chooses)");

  // ---------------------------------------------------------------- custom input
  const cu = await dbg(a, GOOD, { kind: "custom", args: [[3, -1, 4]] });
  check(cu.status === 200 && cu.json.trace.result.v === 6 && cu.json.expected === undefined && cu.json.label === "Your input", "custom input works, and NO expected answer is sent back (it would reveal what the hidden tests expect)", JSON.stringify(cu.json?.expected));
  check((await dbg(a, GOOD, { kind: "custom", args: [["x"]] })).status === 400 && (await dbg(a, GOOD, { kind: "custom", args: [[1], 2] })).status === 400 && (await dbg(a, GOOD, { kind: "custom", args: [Array(500).fill(1)] })).status === 400, "bad custom input is refused (wrong type, wrong count, too long)");

  // ---------------------------------------------------------------- input validation and unsupported problems
  check((await dbg(a, GOOD, { kind: "example", index: 9 })).status === 400 && (await dbg(a, GOOD, { kind: "example", index: 0 })).status === 400 && (await dbg(a, GOOD, { kind: "nope" })).status === 400 && (await a.post("/debug", { problem: SLUG, code: GOOD })).status === 400, "a wrong example number, kind or missing source: 400");
  check((await dbg(a, "  ", { kind: "example", index: 1 })).status === 400 && (await dbg(a, "x".repeat(20001), { kind: "example", index: 1 })).status === 400, "empty and over-long code: 400");
  check((await dbg(a, GOOD, { kind: "example", index: 1 }, "no-such-problem")).status === 404, "unknown problem: 404");
  const ll = await dbg(a, "def merge_two_lists(a, b):\n    return a\n", { kind: "example", index: 1 }, "merge-two-lists");
  check(ll.status === 422 && /linked list or a tree/.test(ll.json.error), "a linked-list problem: friendly 422 (not supported yet)", JSON.stringify(ll.json));
  const anon = await fetch(`${base}/debug`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ problem: SLUG, code: GOOD, source: { kind: "example", index: 1 } }) });
  check(anon.status === 401, "without a login: 401");

  // ---------------------------------------------------------------- logging and scoring
  const rows = await DebugRun.find({ learnerId: a.learnerId }).lean();
  check(rows.length >= 15 && rows.every((r) => r.codeHash && r.version === "debug-1" && !("code" in r)), "every traced run is logged with a hash of the code (not the code) and a version", `(${rows.length} rows)`);
  const r1 = rows.find((r) => r.sourceKind === "example" && r.matchedExpected === true);
  check(r1 && r1.steps > 10 && r1.resultKind === "returned", "the log row says how many steps, how it ended and whether the output matched the expected one");
  check((await RatingUpdate.countDocuments({ learnerId: a.learnerId })) === 1 && (await HintEvent.countDocuments({ learnerId: a.learnerId })) === 0, "debugging is not help and does not move the rating (only the one Submit made a rating update; no hint events)");

  // ---------------------------------------------------------------- erasing
  const erased = await a.del(`/learners/${a.learnerId}/data`);
  check(erased.status === 200 && (await DebugRun.countDocuments({ learnerId: a.learnerId })) === 0, "'delete my data' erases the debug log too");

  // ---------------------------------------------------------------- the limit
  const c = await learner();
  let refused = null;
  for (let i = 0; i < 41 && !refused; i++) {
    const r = await dbg(c, "def peak_altitude(changes):\n    return 0\n", { kind: "custom", args: [[1]] });
    if (r.status === 429) refused = i + 1;
  }
  check(refused === 41, "the 41st traced run in an hour is refused with a friendly message (limit 40)", `(refused at ${refused})`);
} finally {
  for (const u of users) await u.deleteAccount().catch(() => {});
  api.kill();
  await mongoose.disconnect();
}
console.log(failures === 0 ? "\nALL DEBUG-FLOW CHECKS PASSED" : `\n${failures} DEBUG-FLOW CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
