// Which failing HIDDEN test do we show the learner after a failed Submit? (pure: no database, no Judge0)
//
// Before this, a Submit that failed on hidden tests said only "9 of 22 failed": nothing to debug with. Now the server shows ONE
// failing hidden test, with its input, the expected output and what the code returned, like the examples.
//   - the SMALLEST failing input (easiest to trace by hand); ties go to the lowest test number
//   - only a test that really ran and failed: wrong answer, a crash on that input, or the one the time limit hit.
//     "not run" tests (the program died earlier) and passed tests are never shown
//   - at most one per Submit, and only for hidden tests (the visible examples are already shown in full)
// A determined learner could collect hidden cases one Submit at a time. That is accepted (it only fools their own rating),
// and one smallest case per Submit keeps it slow.
export const REVEALABLE = ["wrong_answer", "runtime_error", "time_limit"];

const size = (args) => JSON.stringify(args ?? []).length;

/**
 * @param {{results:{idx:number, verdict:string, actual:string|null}[], tests:{idx:number, kind:string, visible:boolean, args:any[], expected:any}[],
 *          decode:(encoded:string|null)=>any}} a
 *   results: the grader's per-test results (all tests of a Submit); tests: the stored tests; decode: encoded output -> plain value
 * @returns {null | {ordinal:number, of:number, kind:string, verdict:string, args:any[], expected:any, actual:any, idx:number}}
 */
export function chooseHiddenFailure({ results, tests, decode }) {
  const hidden = tests.filter((t) => !t.visible).sort((a, b) => a.idx - b.idx);
  if (hidden.length === 0) return null;
  const byIdx = new Map(results.map((r) => [r.idx, r]));
  const failing = hidden.filter((t) => REVEALABLE.includes(byIdx.get(t.idx)?.verdict));
  if (failing.length === 0) return null;
  failing.sort((a, b) => size(a.args) - size(b.args) || a.idx - b.idx);
  const t = failing[0];
  const r = byIdx.get(t.idx);
  return {
    idx: t.idx, ordinal: hidden.indexOf(t) + 1, of: hidden.length, kind: t.kind, verdict: r.verdict,
    args: t.args, expected: t.expected, actual: decode(r.actual),
  };
}
