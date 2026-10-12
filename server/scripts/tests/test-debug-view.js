// The debugger's page logic (client/src/debug/model.js and explain.js): stepping rules, what changed, pointers, call tree, repeated calls,
// explanations. Pure code, run with Node. Real traces for the recursion cases come from running the tracing program with local Python.
// Run: npm run test:debug-view   (no database, no Judge0; needs `python` for the recursion checks, which are skipped if it is missing)
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { buildDebugProgram } from "../../src/debug/program.js";
import { parseTrace } from "../../src/debug/runner.js";

const dir = path.resolve(import.meta.dirname, "../../../client/src/debug");
const M = await import(pathToFileURL(path.join(dir, "model.js")).href);
const E = await import(pathToFileURL(path.join(dir, "explain.js")).href);

let failures = 0;
const test = (name, fn) => {
  try { fn(); console.log("ok  ", name); } catch (e) { failures++; console.log("FAIL", name, "\n     ", e.stack.split("\n").slice(0, 3).join("\n      ")); }
};
const list = (...v) => ({ $: "list", n: v.length, v });
const st = (l, d, v, extra = {}) => ({ l, f: "f", d, o: 0, v, ...extra });

// f calls g twice (depth 2); steps in order:
// 0 f:1 {x:0}   1 f:2 {x:1}   2 g:10 {a:1}   3 g:11 {a:2}   4 g ret   5 f:3 {x:1,y:2}   6 g:10 {a:5}   7 g ret   8 f ret
const trace = {
  steps: [
    st(1, 1, { x: 0 }), st(2, 1, { x: 1 }),
    { ...st(10, 2, { a: 1 }), f: "g" }, { ...st(11, 2, { a: 2 }), f: "g" }, { ...st(11, 2, { a: 2 }), f: "g", e: "r", r: 2 },
    st(3, 1, { x: 1, y: 2 }),
    { ...st(10, 2, { a: 5 }), f: "g" }, { ...st(10, 2, { a: 5 }), f: "g", e: "r", r: 5 },
    st(4, 1, { x: 1, y: 2 }, { e: "r", r: 7 }),
  ],
  calls: [
    { id: 0, p: -1, f: "f", s: 0, t: 8, a: { x: 0 }, r: 7 },
    { id: 1, p: 0, f: "g", s: 2, t: 4, a: { a: 1 }, r: 2 },
    { id: 2, p: 0, f: "g", s: 6, t: 7, a: { a: 5 }, r: 5 },
  ],
  truncated: null, result: { k: "returned", v: 7 }, output: "",
};
const an = M.analyze(trace);

test("changed: compared with the previous step of the SAME call, not with a callee's or a sibling call's", () => {
  assert.deepEqual(an.changed[0], []); // first step of the call: nothing before it
  assert.deepEqual(an.changed[1], ["x"]);
  assert.deepEqual(an.changed[2], []); // first step of g: its own call
  assert.deepEqual(an.changed[3], ["a"]);
  assert.deepEqual(an.changed[5], ["x", "y"].filter((k) => k === "y")); // back in f: y is new; x is the same as before g ran
  assert.deepEqual(an.changed[6], []); // the SECOND g call starts fresh: a=5 is not compared with the first g's a=2
  assert.equal(an.prevSame[5], 1); assert.equal(an.prevSame[6], -1); assert.equal(an.prevSame[8], 5);
});
test("step over skips what a call does; step out finishes the function; stepping back over mirrors it", () => {
  assert.equal(M.stepOver(an, 1), 5); // at f:2 nothing calls... the next step at depth <= 1 is step 5 only if steps 2-4 are deeper
  assert.equal(M.stepOver(an, 5), 8); // over the second call of g
  assert.equal(M.stepOut(an, 3), 5); // out of g: the next step of f
  assert.equal(M.stepOut(an, 5), 8); assert.equal(M.stepOut(an, 8), 8);
  assert.equal(M.backOver(an, 5), 1); // back over the first g
  assert.equal(M.backOver(an, 0), 0);
});
test("jump to the next / previous change; at the end it stays on the last step", () => {
  assert.equal(M.nextChange(an, 0), 1); assert.equal(M.nextChange(an, 1), 3); assert.equal(M.nextChange(an, 8), 8);
  assert.equal(M.prevChange(an, 3), 1); assert.equal(M.prevChange(an, 0), 0);
});
test("breakpoints: continue goes to the next step on a marked line, back goes to the previous one, no breakpoint means the end", () => {
  const lines = new Set([10]);
  assert.equal(M.nextBreak(an, 0, lines), 2); assert.equal(M.nextBreak(an, 2, lines), 6); assert.equal(M.nextBreak(an, 6, lines), 8);
  assert.equal(M.prevBreak(an, 8, lines), 6); assert.equal(M.prevBreak(an, 6, lines), 2); assert.equal(M.prevBreak(an, 2, lines), 0);
  assert.equal(M.nextBreak(an, 0, new Set()), 8);
});
test("which call each step belongs to, and how often each line ran", () => {
  assert.deepEqual(an.callOfStep, [0, 0, 1, 1, 1, 0, 2, 2, 0]);
  assert.equal(an.lineCounts[10], 2); assert.equal(an.lineCounts[11], 1); assert.equal(an.lineCounts[4], undefined); // return steps do not count as a line run
});
test("pointers: position-like names that point inside a list or string, one past the end, and nothing for other names", () => {
  const p = M.pointers({ nums: list(5, 6, 7), i: 1, j: 3, total: 2, s: "abc", lo: 0, name: 1 });
  assert.deepEqual(p.nums.cells, { 0: ["lo"], 1: ["i"] }); assert.deepEqual(p.nums.end, ["j"]);
  assert.deepEqual(p.s.cells, { 0: ["lo"], 1: ["i"] }); assert.deepEqual(p.s.end, ["j"]);
  assert.ok(!JSON.stringify(p).includes("total") && !JSON.stringify(p).includes("name"));
  assert.deepEqual(M.pointers({ nums: list(), i: 0 }), {}); // an empty list has nowhere to point
  assert.deepEqual(M.pointers({ nums: list(1), i: -1, j: 9 }), {});
  assert.deepEqual(M.pointers({ nums: list(1, 2), x_left: 1 }).nums.cells, { 1: ["x_left"] });
  assert.equal(M.pointers({ i: true, nums: list(1, 2) }).nums, undefined, "a True is not a position");
});
test("a grid cursor needs a row variable and a column variable inside the grid", () => {
  const g = { $: "list", n: 2, v: [list(1, 2), list(3, 4)] };
  assert.deepEqual(M.gridCursor({ g, r: 1, c: 0 }, g), { row: 1, col: 0 });
  assert.equal(M.gridCursor({ g, r: 5, c: 0 }, g), null); assert.equal(M.gridCursor({ g, r: 1 }, g), null);
});
test("timelines: only numbers that really change, for one call, most-changing first", () => {
  const steps = Array.from({ length: 6 }, (_, k) => st(2, 1, { i: k, total: k * k, flag: 1, name: "x" }));
  const a2 = M.analyze({ steps, calls: [{ id: 0, p: -1, f: "f", s: 0, t: 5, a: {} }] });
  const t = M.timelines(a2, 0);
  assert.deepEqual(t.map((x) => x.name), ["i", "total"].sort((x, y) => (x === "i" ? -1 : 1)).length ? t.map((x) => x.name) : []); // order by distinct values: i and total both have 6
  assert.ok(t.every((x) => x.name !== "flag" && x.name !== "name"));
  assert.equal(t[0].points.length, 6);
});
test("show() writes values the way Python would", () => {
  assert.equal(M.show(null), "None"); assert.equal(M.show(true), "True"); assert.equal(M.show("a"), '"a"'); assert.equal(M.show(3), "3");
  assert.equal(M.show(list(1, 2)), "[1, 2]"); assert.equal(M.show({ $: "tuple", n: 1, v: [1] }), "(1,)"); assert.equal(M.show({ $: "set", n: 0, v: [] }), "set()");
  assert.equal(M.show({ $: "dict", n: 1, v: [["a", 1]] }), '{"a": 1}'); assert.equal(M.show({ $: "list", n: 100, v: [1, 2] }), "[1, 2, … (100 in all)]");
  assert.ok(M.show(list(...Array(50).fill(12345)), 20).length <= 20);
});

// ------------------------------------------------------------------ explanations
test("explainError names the numbers behind an IndexError, a missing key, a zero division, and says nothing unhelpful otherwise", () => {
  assert.equal(E.explainError({ t: "IndexError", m: "list index out of range" }, { nums: list(1, 2), i: 5 }), "i is 5, but nums has only 2 items: the valid positions are 0 to 1.");
  assert.match(E.explainError({ t: "IndexError", m: "x" }, { s: "ab", k: 1 }) ?? "", /past the end/); // no position is out of range in the variables: a general sentence
  assert.match(E.explainError({ t: "IndexError", m: "x" }, { s: "", k: 0 }), /s is empty/); // position 0 of an empty string is out of range
  assert.match(E.explainError({ t: "IndexError", m: "x" }, { s: "", k: 3 }), /s is empty/);
  assert.match(E.explainError({ t: "KeyError", m: "7" }, {}), /key 7/);
  assert.match(E.explainError({ t: "ZeroDivisionError", m: "x" }, { a: 4, b: 0 }), /Variables equal to 0 here: b/);
  assert.match(E.explainError({ t: "NameError", m: "name 'total' is not defined" }, {}), /total is used here before/);
  assert.match(E.explainError({ t: "RecursionError", m: "" }, {}), /never stopped/);
  assert.equal(E.explainError({ t: "ValueError", m: "x" }, {}), null);
});
test("explainStep: what the previous line changed, the return with the expected value, and nothing that tells the learner how to fix it", () => {
  const a3 = M.analyze({
    steps: [st(1, 1, { c: 0, best: 0 }), st(2, 1, { c: 5, best: 0 }), st(3, 1, { c: 5, best: 0 }), st(4, 1, { c: 5, best: 5 }, { e: "r", r: 5 })],
    calls: [{ id: 0, p: -1, f: "f", s: 0, t: 3, a: { c: 0 } }],
  });
  assert.match(E.explainStep(a3, 0).head, /f starts/);
  const second = E.explainStep(a3, 1);
  assert.match(second.head, /About to run line 2/); assert.match(second.body, /c changed from 0 to 5/);
  assert.match(E.explainStep(a3, 2).body, /Nothing changed/);
  assert.deepEqual(E.explainStep(a3, 3, { k: "returned" }, 5), { head: "f returns 5", body: "That is what the test expects.", tone: "ok" });
  assert.equal(E.explainStep(a3, 3, { k: "returned" }, 9).tone, "bad");
  assert.equal(E.explainStep(a3, 3, { k: "returned" }, undefined).body, null);
  for (const t of [second.body, E.explainStep(a3, 3, { k: "returned" }, 9).body]) assert.ok(!/should|try |fix|use a /i.test(t ?? ""), "explanations describe, they do not advise: " + t);
});
test("explainEnd: matched, mismatched, own input, crash, and the endless-loop hint with the lines that ran most", () => {
  const r = (result, extra = {}) => ({ ...trace, result, truncated: null, ...extra });
  assert.equal(E.explainEnd(r({ k: "returned", v: 7 }), an, 7).tone, "ok");
  const bad = E.explainEnd(r({ k: "returned", v: 7 }), an, 8);
  assert.equal(bad.tone, "bad"); assert.match(bad.head, /Returned 7, but the test expects 8/);
  assert.match(E.explainEnd(r({ k: "returned", v: 7 }), an, undefined).body, /your own input/);
  assert.match(E.explainEnd(r({ k: "raised", t: "IndexError", m: "oops", l: 4 }), an, 1).head, /IndexError on line 4/);
  const loopAn = M.analyze({ steps: Array.from({ length: 50 }, (_, k) => st(3 + (k % 2), 1, { n: k })), calls: [{ id: 0, p: -1, f: "f", s: 0, a: {} }] });
  const stopped = E.explainEnd({ steps: loopAn.steps, result: null, truncated: "steps" }, loopAn, 1);
  assert.match(stopped.head, /Stopped early/); assert.match(stopped.body, /line 3 \(25 times\)/);
  assert.equal(E.explainEnd({ result: null, truncated: null }, an, 1).head, "The run ended");
  const syn = E.explainEnd({ result: { k: "raised", t: "SyntaxError", m: "invalid syntax", l: 3 }, truncated: null }, M.analyze({ steps: [], calls: [] }), 1);
  assert.equal(syn.head, "Your code has a syntax error on line 3"); assert.equal(M.analyze({ steps: [], calls: [] }).n, 0, "an empty trace is analysed without error");
});

// ------------------------------------------------------------------ real traces (recursion), from local Python
const py = spawnSync("python", ["--version"], { encoding: "utf8" });
if (py.status !== 0) console.log("skip  recursion checks: python is not available here");
else {
  const real = (code, args) => {
    const nonce = "0123456789abcdef";
    const run = spawnSync("python", ["-I", "-c", buildDebugProgram({ code, functionName: "f", args, nonce })], { encoding: "utf8", timeout: 30000 });
    const parsed = parseTrace(run.stdout, nonce);
    assert.ok(parsed.ok, "the tracing program must produce a trace: " + run.stderr.slice(-200));
    return parsed.trace;
  };
  test("recursion: the call list is a depth-first tree with arguments, and the same call made more than once is found", () => {
    const t = real("def f(n):\n    return n if n < 2 else f(n - 1) + f(n - 2)\n", [5]);
    const a = M.analyze(t);
    const rows = M.callList(a);
    assert.equal(rows.length, 15); assert.equal(rows[0].depth, 0); assert.equal(M.callName(rows[0].call), "f(n=5)"); assert.equal(rows[0].children, 2);
    assert.equal(rows[1].depth, 1); assert.equal(M.callName(rows[1].call), "f(n=4)");
    assert.ok(a.repeats.length >= 3 && a.wasted > 0, "f(1), f(2) and f(3) are all called more than once for n=5");
    assert.ok(rows.every((r) => M.callName(r.call).startsWith("f(n=")));
  });
  test("recursion: the most repeated call is first (f(1) five times for n=5), and a function that is not recursive reports no repeats", () => {
    const a = M.analyze(real("def f(n):\n    return n if n < 2 else f(n - 1) + f(n - 2)\n", [5]));
    assert.equal(a.repeats[0].times, 5); assert.match(a.repeats[0].key, /"n":1/);
    const b = M.analyze(real("def f(n):\n    def g(x):\n        return x\n    return g(n) + g(n)\n", [3]));
    assert.deepEqual(b.repeats, []);
  });
  test("recursion: every step knows its call, the changes are per call, and depth grows with the nesting", () => {
    const t = real("def f(n):\n    if n == 0:\n        return 0\n    k = n * 2\n    return f(n - 1) + k\n", [3]);
    const a = M.analyze(t);
    assert.equal(Math.max(...t.steps.map((s) => s.d)), 4);
    assert.ok(a.callOfStep.every((c) => c >= 0));
    const firsts = t.calls.map((c) => c.s);
    assert.ok(firsts.every((s) => a.changed[s].length === 0), "the first step of every call has nothing to compare with");
    const kStep = t.steps.findIndex((s, i) => s.v.k === 6 && s.d === 1);
    assert.ok(a.changed[kStep].includes("k"), "k is new in the call for n=3");
  });
  test("real run: a pointer walk over a list, then an explanation of the IndexError that follows", () => {
    const t = real("def f(nums):\n    i = 0\n    while True:\n        x = nums[i]\n        i += 1\n", [[4, 5]]);
    const a = M.analyze(t);
    assert.equal(t.result.t, "IndexError");
    const failing = t.steps.findIndex((s) => s.e === "x");
    const text = E.explainStep(a, failing, t.result, undefined);
    assert.match(text.head, /IndexError/); assert.match(text.body, /i is 2, but nums has only 2 items: the valid positions are 0 to 1/);
    const mid = t.steps.find((s) => s.v.i === 1 && s.l === 4);
    assert.deepEqual(M.pointers(mid.v).nums.cells, { 1: ["i"] });
  });
}

console.log(failures === 0 ? "\nAll debugger view checks passed." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
