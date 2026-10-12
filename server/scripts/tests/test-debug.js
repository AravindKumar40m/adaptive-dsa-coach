// Pure checks for the step-through debugger (src/debug/): building the traced program, reading its output, validating typed input.
// No database, no Judge0.   Run: npm run test:debug   (the real runs through Judge0 are in test:debug-flow)
import assert from "node:assert/strict";
import { deflateSync } from "node:zlib";
import { buildDebugProgram, MAX_STEPS } from "../../src/debug/program.js";
import { parseTrace, canTrace } from "../../src/debug/runner.js";
import { validateCustomArgs, plainValue } from "../../src/debug/inputs.js";

let failures = 0;
const test = (name, fn) => {
  try { fn(); console.log("ok  ", name); } catch (e) { failures++; console.log("FAIL", name, "\n     ", e.message); }
};
const NONCE = "0123456789abcdef";
const marker = (obj, nonce = NONCE) => `@@D${nonce}@@${deflateSync(Buffer.from(JSON.stringify(obj))).toString("base64")}@@`;
const GOOD = { steps: [{ l: 1, f: "f", d: 1, o: 0, v: {} }], calls: [], truncated: null, result: { k: "returned", v: 1 }, output: "" };

test("the program carries the code and the input as base64 text, so quotes, backslashes and triple quotes in them cannot break it", () => {
  const code = 'def f(x):\n    s = """\'\'\' \\ " end"""\n    return x\n';
  const p = buildDebugProgram({ code, functionName: "f", args: ["a\"b'c\\d"], nonce: NONCE });
  assert.ok(!p.includes("triple") && !p.includes('s = """'), "the learner's code must not appear as plain text in the program");
  assert.ok(!p.includes("__CODE__") && !p.includes("__ARGS__") && !p.includes("__NONCE__") && !p.includes("__FUNCTION__"), "every placeholder is filled");
  assert.ok(p.includes(`_MAX_STEPS = ${MAX_STEPS}`));
});
test("a bad nonce or function name is refused (they go into the program text)", () => {
  assert.throws(() => buildDebugProgram({ code: "x", functionName: "f", args: [], nonce: "zz" }), /nonce/);
  assert.throws(() => buildDebugProgram({ code: "x", functionName: 'f"); import os #', args: [], nonce: NONCE }), /function name/);
  assert.throws(() => buildDebugProgram({ code: "x", functionName: "F", args: [], nonce: NONCE }), /function name/);
});
test("parseTrace reads the marked line, and ignores everything else the program printed", () => {
  const r = parseTrace(`hello\nsome learner output @@D${NONCE}@@not-base64!!@@\n${marker(GOOD)}\nmore`, NONCE);
  assert.equal(r.ok, true); assert.equal(r.trace.result.v, 1);
});
test("a marker with the wrong nonce does not count (a learner cannot forge the trace by printing one)", () => {
  assert.deepEqual(parseTrace(marker(GOOD, "ffffffffffffffff"), NONCE), { ok: false, reason: "no_trace" });
});
test("no marker, garbage, and a wrong shape are refused without throwing", () => {
  assert.equal(parseTrace("", NONCE).reason, "no_trace");
  assert.equal(parseTrace(null, NONCE).reason, "no_trace");
  assert.equal(parseTrace(`@@D${NONCE}@@AAAA@@`, NONCE).reason, "bad_trace");
  assert.equal(parseTrace(marker({ steps: "no", calls: [] }), NONCE).reason, "bad_trace");
  assert.equal(parseTrace(marker([1, 2, 3]), NONCE).reason, "bad_trace");
});
test("a decompression bomb is refused (the output is capped)", () => {
  const bomb = deflateSync(Buffer.alloc(40_000_000, 0x20)).toString("base64");
  assert.equal(parseTrace(`@@D${NONCE}@@${bomb}@@`, NONCE).reason, "bad_trace");
});
test("more steps than the cap are cut", () => {
  const many = { ...GOOD, steps: Array.from({ length: MAX_STEPS + 500 }, (_, i) => ({ l: 1, f: "f", d: 1, o: 0, v: { i } })) };
  assert.equal(parseTrace(marker(many), NONCE).trace.steps.length, MAX_STEPS);
});
test("canTrace: plain value types yes, linked lists and trees no, no parameters at all is fine", () => {
  const sig = (...types) => ({ params: types.map((type, i) => ({ name: "p" + i, type })) });
  assert.ok(canTrace(sig("int", "bool", "string", "int[]", "int[][]")));
  assert.ok(!canTrace(sig("int[]", "ListNode"))); assert.ok(!canTrace(sig("TreeNode"))); assert.ok(!canTrace(sig("CycleList")));
  assert.ok(!canTrace(null)); assert.ok(!canTrace({}));
});

const params = [{ name: "nums", type: "int[]" }, { name: "k", type: "int" }];
test("validateCustomArgs accepts a correct input and returns it as it is", () => {
  assert.deepEqual(validateCustomArgs(params, [[1, -2, 3], 2]), { ok: true, args: [[1, -2, 3], 2] });
  assert.equal(validateCustomArgs([{ name: "s", type: "string" }], ["héllo"]).ok, true);
  assert.equal(validateCustomArgs([{ name: "b", type: "bool" }], [false]).ok, true);
  assert.equal(validateCustomArgs([{ name: "g", type: "int[][]" }], [[[1, 2], [], [3]]]).ok, true);
});
test("validateCustomArgs refuses wrong counts, wrong types, fractions, huge numbers and big sizes, and names the parameter", () => {
  const bad = (p, a) => { const r = validateCustomArgs(p, a); assert.equal(r.ok, false, JSON.stringify(a)); return r.error; };
  assert.match(bad(params, [[1]]), /exactly 2/);
  assert.match(bad(params, "nope"), /exactly 2/);
  assert.match(bad(params, [[1], 2, 3]), /exactly 2/);
  assert.match(bad(params, [[1.5], 2]), /nums must be/);
  assert.match(bad(params, [["1"], 2]), /nums must be/);
  assert.match(bad(params, [[1], 1e12]), /k must be/);
  assert.match(bad(params, [[1], "2"]), /k must be/);
  assert.match(bad(params, [Array(31).fill(1), 1]), /nums must be/);
  assert.match(bad(params, [null, 1]), /nums must be/);
  assert.match(bad([{ name: "s", type: "string" }], ["x".repeat(101)]), /s must be/);
  assert.match(bad([{ name: "s", type: "string" }], [5]), /s must be/);
  assert.match(bad([{ name: "b", type: "bool" }], [1]), /b must be/);
  assert.match(bad([{ name: "g", type: "int[][]" }], [Array(13).fill([1])]), /g must be/);
  assert.match(bad([{ name: "g", type: "int[][]" }], [Array(10).fill(Array(9).fill(1))]), /g must be/);
  assert.match(bad([{ name: "t", type: "TreeNode" }], [[1]]), /cannot be traced/);
});
test("plainValue turns traced lists back into plain arrays and refuses anything it cannot compare", () => {
  assert.deepEqual(plainValue({ $: "list", n: 2, v: [1, { $: "list", n: 1, v: [2] }] }), [1, [2]]);
  assert.equal(plainValue(7), 7); assert.equal(plainValue("a"), "a"); assert.equal(plainValue(true), true); assert.equal(plainValue(null), null);
  assert.equal(plainValue({ $: "dict", n: 0, v: [] }), undefined); assert.equal(plainValue({ $: "obj", v: "<x>" }), undefined);
});

console.log(failures === 0 ? "\nAll debugger unit checks passed." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
