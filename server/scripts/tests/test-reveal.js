// Which failing hidden test is shown (server/src/grading/reveal.js). Pure logic, no services needed.   Run: npm run test:reveal
import { REVEALABLE, chooseHiddenFailure } from "../../src/grading/reveal.js";

let failures = 0;
const check = (ok, label, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`); };

const decode = (s) => (s == null ? null : s.startsWith("ERR:") ? s : JSON.parse(s));
// a problem with 2 visible examples and 6 hidden tests (idx 2..7): [kind, args, expected]
const T = (idx, visible, kind, args, expected) => ({ idx, visible, kind, args, expected });
const tests = [
  T(0, true, "example", [[1, 2]], 3), T(1, true, "example", [[5]], 5),
  T(2, false, "edge", [[]], 0), T(3, false, "edge", [[9, 9, 9, 9, 9, 9]], 54), T(4, false, "random", [[3, 1, 4, 1, 5, 9, 2, 6]], 31),
  T(5, false, "random", [[7, 7]], 14), T(6, false, "random", [[2, 3, 4]], 9), T(7, false, "random", [[1, 1, 1, 1]], 4),
];
const R = (idx, verdict, actual) => ({ idx, verdict, actual });
const allPass = tests.map((t) => R(t.idx, "passed", JSON.stringify(t.expected)));
const withOverrides = (o) => allPass.map((r) => o[r.idx] ?? r);

check(chooseHiddenFailure({ results: allPass, tests, decode }) === null, "every test passes: nothing is shown");
check(REVEALABLE.join() === "wrong_answer,runtime_error,time_limit", "only wrong answers, crashes and the time-limit hit can be shown");

// 13/22 style: several hidden tests fail: the SMALLEST failing input is shown (idx 2 is empty: [] is 2 characters, the smallest)
let r = chooseHiddenFailure({ results: withOverrides({ 3: R(3, "wrong_answer", "50"), 4: R(4, "wrong_answer", "30"), 2: R(2, "wrong_answer", "-1") }), tests, decode });
check(r && r.idx === 2 && r.args[0].length === 0 && r.expected === 0 && r.actual === -1 && r.kind === "edge", "several fail: the smallest input is shown, with its expected and the code's own output", JSON.stringify(r));
check(r.ordinal === 1 && r.of === 6, "it is hidden test 1 of 6 (the ordinal counts hidden tests only, not the examples)");

// the smallest wins over the first: idx 3 (6 values) and idx 6 (3 values) fail, idx 6 is smaller
r = chooseHiddenFailure({ results: withOverrides({ 3: R(3, "wrong_answer", "50"), 6: R(6, "wrong_answer", "8") }), tests, decode });
check(r.idx === 6 && r.ordinal === 5 && r.actual === 8, "the smallest failing input wins over the first failing one (3 values beat 6)", `(idx ${r.idx}, ordinal ${r.ordinal})`);

// equal sizes: the lower test number
r = chooseHiddenFailure({ results: withOverrides({ 5: R(5, "wrong_answer", "0"), 7: R(7, "wrong_answer", "0") }), tests: tests.map((t) => (t.idx === 7 ? { ...t, args: [[1, 1]] } : t)), decode });
check(r.idx === 5, "equal sizes: the lower test number is shown");

// visible examples are never "revealed": they are already shown in full
check(chooseHiddenFailure({ results: withOverrides({ 0: R(0, "wrong_answer", "99"), 1: R(1, "wrong_answer", "99") }), tests, decode }) === null, "a failure only in the visible examples: nothing extra is shown");
r = chooseHiddenFailure({ results: withOverrides({ 0: R(0, "wrong_answer", "99"), 4: R(4, "wrong_answer", "30") }), tests, decode });
check(r.idx === 4, "a visible example and a hidden test fail: the hidden one is the one revealed");

// crashes and time limits
r = chooseHiddenFailure({ results: withOverrides({ 2: R(2, "runtime_error", "ERR:IndexError") }), tests, decode });
check(r.idx === 2 && r.verdict === "runtime_error" && r.actual === "ERR:IndexError", "a crash on a hidden input: shown, with the error name as the output");
r = chooseHiddenFailure({ results: withOverrides({ 4: R(4, "time_limit", null), 5: R(5, "not_run", null), 6: R(6, "not_run", null), 7: R(7, "not_run", null) }), tests, decode });
check(r.idx === 4 && r.verdict === "time_limit" && r.actual === null, "the test the time limit hit is shown (output: none); the tests after it, which never ran, are not");
check(chooseHiddenFailure({ results: withOverrides({ 5: R(5, "not_run", null), 6: R(6, "not_run", null) }), tests, decode }) === null, "tests that did not run are never shown");

// exactly one, never a passing test, never invented data
r = chooseHiddenFailure({ results: withOverrides({ 3: R(3, "wrong_answer", "50"), 4: R(4, "wrong_answer", "30"), 5: R(5, "wrong_answer", "13") }), tests, decode });
check(!Array.isArray(r) && tests.filter((t) => !t.visible).some((t) => t.idx === r.idx), "the result is a single test (not a list) and it is one of the stored hidden tests");
check(JSON.stringify(Object.keys(r).sort()) === JSON.stringify(["actual", "args", "expected", "idx", "kind", "of", "ordinal", "verdict"]), "and it carries only the input, expected, actual, kind, verdict and its place", JSON.stringify(Object.keys(r).sort()));

// no hidden tests at all (a problem with only examples), and a missing result row
check(chooseHiddenFailure({ results: [R(0, "wrong_answer", "1")], tests: [T(0, true, "example", [1], 2)], decode }) === null, "a problem with only visible tests: nothing to reveal");
check(chooseHiddenFailure({ results: [], tests, decode }) === null, "no results at all: nothing is shown and nothing crashes");

console.log(failures === 0 ? "\nALL REVEAL CHECKS PASSED" : `\n${failures} REVEAL CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
