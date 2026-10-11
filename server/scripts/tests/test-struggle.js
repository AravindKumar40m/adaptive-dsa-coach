// Struggle nudge rule (struggle.js): when a hint is suggested and, just as important, when it is NOT.
// Pure maths, no services needed.  Run: npm run test:struggle
import { MAX_NUDGES_PER_PROBLEM, MIN_FAILED_ATTEMPTS, NUDGE_GAP_MS, evaluateStruggle } from "../../src/help/struggle.js";

let failures = 0;
const check = (ok, label, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`); };

const NOW = 10_000_000;
const MIN = 60_000;
const run = (verdict, passed, total = 2, mode = "run") => ({ mode, verdict, passed, total, at: NOW });
const stuck = [run("wrong_answer", 1), run("wrong_answer", 1), run("wrong_answer", 1)]; // three failed Runs, same 1 of 2 each time
const ask = (over = {}) => evaluateStruggle({ attempts: stuck, secondsSpent: 400, difficultyLabel: "easy", helpLevel: 0, shownAt: [], now: NOW, ...over });

// the classic stuck pattern: 3 failures, 400 s on an easy problem (half of the expected 600 s is 300 s), no progress, no help yet
let r = ask();
check(r.offer && r.nextLevel === 1 && r.blockedBy.length === 0, "3 failed attempts, 400 s on an easy problem, no progress, no help: suggest hint level 1");
check(r.signals.failedAttempts === 3 && r.signals.expectedSeconds === 600 && r.signals.noProgress === true && r.signals.secondsSpent === 400, "the signals say why (3 failures, 600 s expected, no progress)");
check(MIN_FAILED_ATTEMPTS === 3 && MAX_NUDGES_PER_PROBLEM === 2 && NUDGE_GAP_MS === 10 * MIN, "the constants are 3 failures, 2 nudges per problem, 10 minutes apart");
check(ask({ helpLevel: 1 }).nextLevel === 2, "with hint level 1 already open, the suggestion is level 2");

// each condition on its own stops the nudge
check(ask({ attempts: stuck.slice(1) }).blockedBy.join() === "few_attempts", "only 2 failed attempts: not yet");
check(ask({ secondsSpent: 299 }).blockedBy.join() === "not_long_enough" && ask({ secondsSpent: 300 }).offer, "299 s is too early, 300 s (half of 600) is enough");
check(ask({ secondsSpent: null }).blockedBy.join() === "not_long_enough", "an unknown time never triggers a nudge");
check(ask({ difficultyLabel: "hard", secondsSpent: 1199 }).blockedBy.includes("not_long_enough") && ask({ difficultyLabel: "hard", secondsSpent: 1200 }).offer, "hard problems wait longer: half of 2400 s = 1200 s");
check(ask({ attempts: [run("wrong_answer", 0), run("wrong_answer", 1), run("wrong_answer", 2)] }).blockedBy.join() === "making_progress", "passing more tests each time (0, 1, 2) is progress: no nudge");
check(ask({ attempts: [run("wrong_answer", 2), run("wrong_answer", 1), run("wrong_answer", 1)] }).offer, "doing worse than the best earlier attempt counts as no progress");
check(ask({ helpLevel: 2 }).blockedBy.join() === "already_has_help", "once hint level 2 is open, we stop suggesting more");
check(ask({ attempts: [...stuck.slice(0, 2), run("accepted", 2)] }).blockedBy.includes("not_a_failure"), "a passing attempt never gets a nudge");
check(ask({ shownAt: [NOW - 60 * MIN, NOW - 30 * MIN] }).blockedBy.join() === "nudged_enough", "never more than 2 nudges on one problem");
check(ask({ shownAt: [NOW - 5 * MIN] }).blockedBy.join() === "nudged_recently" && ask({ shownAt: [NOW - 11 * MIN] }).offer, "one nudge 5 minutes ago blocks it; 11 minutes ago does not");

// details
check(ask({ attempts: [run("compile_error", 0), run("compile_error", 0), run("compile_error", 0)] }).offer, "three compile errors in a row count as being stuck too");
const mixed = [run("wrong_answer", 1, 2, "run"), run("wrong_answer", 5, 10, "submit"), run("wrong_answer", 1, 2, "run"), run("wrong_answer", 5, 10, "submit"), run("wrong_answer", 1, 2, "run")];
check(ask({ attempts: mixed }).offer, "Runs are compared with Runs and Submits with Submits (1/2 then 5/10 is not 'getting worse')");
check(ask({ attempts: [run("wrong_answer", 1), run("wrong_answer", 1, 2, "submit"), run("wrong_answer", 1)] }).offer, "a Run, a Submit and a Run that all fail count as 3 failed attempts");
check(ask({ attempts: [run("wrong_answer", 0), run("wrong_answer", 1), run("runtime_error", 0), run("wrong_answer", 1)] }).offer, "four failures with the latest no better than the best earlier one: offer");
const empty = evaluateStruggle({ attempts: [], secondsSpent: 999, difficultyLabel: "easy", helpLevel: 0, shownAt: [], now: NOW });
check(empty.offer === false && empty.blockedBy.includes("not_a_failure"), "no attempts at all: no nudge and no crash");

console.log(failures === 0 ? "\nALL STRUGGLE CHECKS PASSED" : `\n${failures} STRUGGLE CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
