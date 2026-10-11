// Unit tests for the Logging v2 helpers: error classifier, code signals, work-pattern validator. No database or Judge0.
// Run: npm run test:signals
import assert from "node:assert/strict";
import { sanitizeActivity } from "../src/activity.js";
import { approachSimilarity, codeStats, stripNoise } from "../src/codeSignals.js";
import { classifyCompile, classifyRun, effectiveSignal } from "../src/errors.js";

let failures = 0;
const test = (name, fn) => {
  try { fn(); console.log("ok  ", name); } catch (e) { failures++; console.log("FAIL", name, "\n     ", e.message); }
};

// ---------------------------------------------------------------- compile errors
test("compile errors are sorted into a few kinds", () => {
  const cases = [
    ["  File \"script.py\", line 1\n    def f(x) return 1\nSyntaxError: invalid syntax", "syntax"],
    ["Main.java:3: error: ';' expected", "syntax"],
    ["script.cpp:5:3: error: expected ';' before 'return'", "syntax"],
    ["Main.java:4: error: cannot find symbol\n  symbol: variable y", "undefined_name"],
    ["script.cpp:6:9: error: 'y' was not declared in this scope", "undefined_name"],
    ["NameError: name 'y' is not defined", "undefined_name"],
    ["Main.java:7: error: incompatible types: String cannot be converted to int", "type_mismatch"],
    ["script.cpp:8: error: invalid conversion from 'const char*' to 'int'", "type_mismatch"],
    ["Main.java:9: error: missing return statement", "missing_return"],
    ["script.cpp:9: warning: control reaches end of non-void function", "missing_return"],
    ["something nobody has seen before", "compile_other"],
    ["", "compile_other"],
  ];
  for (const [text, want] of cases) assert.equal(classifyCompile(text), want, text);
});

// ---------------------------------------------------------------- runtime errors
test("a per-test exception name from the harness becomes name + family", () => {
  const cases = [
    ["ERR:IndexError", "IndexError", "index_out_of_range"],
    ["ERR:ArrayIndexOutOfBoundsException", "ArrayIndexOutOfBoundsException", "index_out_of_range"],
    ["ERR:NullPointerException", "NullPointerException", "null_reference"],
    ["ERR:KeyError", "KeyError", "missing_key"],
    ["ERR:ZeroDivisionError", "ZeroDivisionError", "zero_division"],
    ["ERR:RecursionError", "RecursionError", "recursion_depth"],
    ["ERR:TypeError", "TypeError", "type_error"],
    ["ERR:BadType", "BadType", "wrong_return_type"],
    ["ERR:Cycle", "Cycle", "cycle_in_result"],
    ["ERR:exception", "exception", "cpp_exception"],
    ["ERR:SomethingWeird", "SomethingWeird", "other"],
  ];
  for (const [actual, name, family] of cases) {
    const r = classifyRun({ verdict: "runtime_error", tests: [{ actual: "5" }, { actual }] });
    assert.deepEqual(r, { errorName: name, errorFamily: family }, actual);
  }
});
test("when the whole process died, stderr and the exit signal decide", () => {
  const died = (extra) => classifyRun({ verdict: "runtime_error", tests: [{ actual: null }], ...extra });
  assert.deepEqual(died({ stderr: 'Exception in thread "main" java.lang.StackOverflowError\n\tat Main.f' }), { errorName: "StackOverflowError", errorFamily: "recursion_depth" });
  assert.deepEqual(died({ stderr: "terminate called after throwing an instance of 'std::out_of_range'\n  what(): vector::_M_range_check" }), { errorName: "std::out_of_range", errorFamily: "index_out_of_range" });
  assert.deepEqual(died({ stderr: 'Traceback (most recent call last):\n  File "x", line 3\nKeyError: 5' }), { errorName: "KeyError", errorFamily: "missing_key" });
  assert.deepEqual(died({ exitSignal: 11 }), { errorName: "SIGSEGV", errorFamily: "segfault" });
  assert.deepEqual(died({ exitSignal: 8 }), { errorName: "SIGFPE", errorFamily: "zero_division" });
  assert.deepEqual(died({ exitSignal: 6 }), { errorName: "SIGABRT", errorFamily: "abort" });
  assert.deepEqual(died({}), { errorName: null, errorFamily: "other" });
});
test("the signal is derived from the exit code when Judge0 gives none (our setup runs C++ through a shell script)", () => {
  assert.equal(effectiveSignal(null, 139), 11);
  assert.equal(effectiveSignal(undefined, 136), 8);
  assert.equal(effectiveSignal(null, 134), 6);
  assert.equal(effectiveSignal(9, 0), 9);
  assert.equal(effectiveSignal(null, 1), null);
  assert.equal(effectiveSignal(null, 0), null);
  assert.equal(effectiveSignal(null, 200), null, "above 128+64 is not a signal");
  assert.equal(effectiveSignal(null, null), null);
});
test("the shell's own words are understood when no exit code survives", () => {
  const died = (stderr) => classifyRun({ verdict: "runtime_error", tests: [{ actual: null }], stderr });
  assert.deepEqual(died("run: line 1:     3 Segmentation fault      LD_LIBRARY_PATH=/usr/local/gcc ./a.out"), { errorName: "SIGSEGV", errorFamily: "segfault" });
  assert.deepEqual(died("run: line 1:     3 Floating point exception LD_LIBRARY_PATH=x ./a.out"), { errorName: "SIGFPE", errorFamily: "zero_division" });
  assert.deepEqual(died("run: line 1:     3 Aborted                 ./a.out"), { errorName: "SIGABRT", errorFamily: "abort" });
});
test("other verdicts", () => {
  assert.deepEqual(classifyRun({ verdict: "time_limit", tests: [] }), { errorName: "TimeLimit", errorFamily: "timeout" });
  assert.deepEqual(classifyRun({ verdict: "accepted", tests: [] }), { errorName: null, errorFamily: null });
  assert.deepEqual(classifyRun({ verdict: "wrong_answer", tests: [{ actual: "3" }] }), { errorName: null, errorFamily: null });
  assert.deepEqual(classifyRun({ verdict: "compile_error", compileOutput: "error: cannot find symbol", tests: [] }), { errorName: null, errorFamily: "undefined_name" });
});

// ---------------------------------------------------------------- code signals
const PY_NESTED = `def solve(nums):
    # for while in a comment must not count
    total = 0
    for i in range(len(nums)):
        for j in range(i):
            total += 1
    msg = "while for inside a string"
    return total
`;
test("python: loops, nesting depth and strings/comments are read correctly", () => {
  const s = codeStats(PY_NESTED, "python", "solve");
  assert.equal(s.loops, 2);
  assert.equal(s.loopDepth, 2);
  assert.equal(s.selfCalls, 0);
  assert.equal(s.lines, 8);
  assert.equal(s.nonBlankLines, 8);
});
test("python: sequential loops are depth 1, recursion is counted, helper structures are noticed", () => {
  const code = `def solve(n, memo={}):\n    for a in range(n):\n        pass\n    for b in range(n):\n        pass\n    if n < 2: return n\n    return solve(n - 1) + solve(n - 2)\n`;
  const s = codeStats(code, "python", "solve");
  assert.equal(s.loops, 2); assert.equal(s.loopDepth, 1); assert.equal(s.selfCalls, 2);
  assert.equal(codeStats("x = sorted(a)\nd = dict()\n", "python", "f").usesSort, true);
  assert.equal(codeStats("x = sorted(a)\nd = dict()\n", "python", "f").usesHash, true);
  assert.equal(codeStats("import heapq\n", "python", "f").usesHeap, true);
  assert.equal(codeStats("q = deque()\n", "python", "f").usesStackQueue, true);
  assert.equal(codeStats("x = 1\n", "python", "f").usesSort, false);
});
test("recursion is found under the camelCase name Java and JavaScript use", () => {
  const js = "function peakAltitude(a, i = 0) {\n  if (i >= a.length) return 0;\n  return Math.max(a[i], peakAltitude(a, i + 1));\n}";
  assert.equal(codeStats(js, "javascript", "peak_altitude").selfCalls, 1);
  assert.equal(codeStats("def peak_altitude(a):\n    return 0\n", "python", "peak_altitude").selfCalls, 0);
});
test("java/c++/javascript: brace-based loop depth", () => {
  const java = `class Solution {\n  int solve(int[] a) {\n    int t = 0;\n    for (int i = 0; i < a.length; i++) {\n      while (t < 5) {\n        t++;\n      }\n    }\n    for (int k = 0; k < 3; k++) { t++; }\n    return t; // for\n  }\n}`;
  const s = codeStats(java, "java", "solve");
  assert.equal(s.loops, 3); assert.equal(s.loopDepth, 2);
  const js = `function f(a) { for (const x of a) { for (const y of a) { } } return 0; }`;
  assert.equal(codeStats(js, "javascript", "f").loopDepth, 2);
  assert.equal(codeStats("int f(){ if (x) { return 1; } return 0; }", "cpp", "f").loopDepth, 0);
});
test("stripNoise removes comments and string contents", () => {
  assert.ok(!/while/.test(stripNoise('x = "while"  # for', "python")));
  assert.ok(!/for/.test(stripNoise('int a; // for\n/* while */ char* s = "for";', "cpp")));
});

const OPT = "def f(a):\n    best = h = 0\n    for c in a:\n        h += c\n        best = max(best, h)\n    return best\n";
const BRUTE = "def f(a):\n    best = 0\n    for i in range(len(a)):\n        s = 0\n        for j in range(i, len(a)):\n            s += a[j]\n            if s > best:\n                best = s\n    return best\n";
test("approach similarity: identical code matches itself, renaming variables barely matters, other code is far", () => {
  const refs = [{ approach: "brute", code: BRUTE }, { approach: "optimal", code: OPT }];
  const same = approachSimilarity(OPT, "python", refs);
  assert.equal(same.closest, "optimal"); assert.equal(same.similarity, 1);
  const renamed = approachSimilarity(OPT.replaceAll("best", "answer").replaceAll("h ", "running ").replaceAll("c", "step"), "python", refs);
  assert.equal(renamed.closest, "optimal"); assert.ok(renamed.similarity > 0.6, `renamed similarity ${renamed.similarity}`);
  const brute = approachSimilarity(BRUTE, "python", refs);
  assert.equal(brute.closest, "brute");
  assert.ok(brute.byApproach.brute > brute.byApproach.optimal + 0.3);
  const stub = approachSimilarity("def f(a):\n    pass\n", "python", refs);
  assert.ok(stub.similarity < 0.2, `stub similarity ${stub.similarity}`);
  assert.equal(approachSimilarity(OPT, "python", []), null);
});

// ---------------------------------------------------------------- work-pattern validator
test("activity: unknown keys dropped, numbers clamped and rounded, junk ignored", () => {
  const a = sanitizeActivity({ editCount: 12.7, charsPasted: -5, activeMs: 1e12, idleMs: "5", evil: "<script>", tzOffsetMin: 330, maxPaste: NaN, openToFirstEditMs: null, nested: { x: 1 } });
  assert.deepEqual(a, { editCount: 13, charsPasted: 0, activeMs: 6 * 3600 * 1000, tzOffsetMin: 330 });
  assert.equal(sanitizeActivity(null), null);
  assert.equal(sanitizeActivity([1, 2]), null);
  assert.equal(sanitizeActivity("x"), null);
  assert.equal(sanitizeActivity({ evil: 1 }), null);
});

console.log(failures === 0 ? "\nAll signal-helper tests passed." : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
