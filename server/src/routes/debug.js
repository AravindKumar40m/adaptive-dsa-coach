import { Router } from "express";
import { createHash } from "node:crypto";
import { makeLimiter } from "../core/rateLimit.js";
import { DEBUG_VERSION } from "../core/versions.js";
import { Problem } from "../models/Problem.js";
import { TestCase } from "../models/TestCase.js";
import { Submission } from "../models/Submission.js";
import { DebugRun } from "../models/DebugRun.js";
import { canTrace, runTrace } from "../debug/runner.js";
import { validateCustomArgs, plainValue } from "../debug/inputs.js";

// "Step through my code" (Python): runs the learner's function ONCE with tracing on and sends back every step, so the page can
// replay it forwards and backwards without more calls. The code is sent by the browser (the learner is debugging the code in their
// editor, saved or not) but the INPUT comes from one of three places:
//   example : one of the visible examples (by number)
//   failing : the ONE hidden test the server showed after a failed Submit (looked up here, never named by the browser, so this cannot
//             be used to reach any other hidden test)
//   custom  : an input the learner typed (validated against the problem's parameter types, small sizes only)
// For custom input no reference answer is returned (it would let anybody read the answers of hidden tests). Debugging is not "help":
// it never changes the rating.
const router = Router();
const limiter = makeLimiter(40, 3600 * 1000); // traced runs per learner per hour: each takes a few seconds in the sandbox
const MAX_CODE_CHARS = 20000;

router.post("/debug", async (req, res, next) => {
  try {
    const { learnerId, problem: slug, code, source } = req.body ?? {};
    if (typeof code !== "string" || code.trim() === "") return res.status(400).json({ error: "code is empty" });
    if (code.length > MAX_CODE_CHARS) return res.status(400).json({ error: `code is longer than ${MAX_CODE_CHARS} characters` });
    const kind = source?.kind;
    if (!["example", "failing", "custom"].includes(kind)) return res.status(400).json({ error: "source.kind must be example, failing or custom" });

    const problem = await Problem.findOne({ slug }).lean();
    if (!problem) return res.status(404).json({ error: "problem not found" });
    if (!canTrace(problem.signature)) return res.status(422).json({ error: "Stepping through is not available for this kind of problem yet (it takes a linked list or a tree)." });
    const params = problem.signature.params.map((p) => ({ name: p.name, type: p.type }));

    let args, expected, label;
    if (kind === "example") {
      const visible = await TestCase.find({ problem: slug, visible: true }).sort({ idx: 1 }).lean();
      const n = Number(source.index);
      if (!Number.isInteger(n) || n < 1 || n > visible.length) return res.status(400).json({ error: `example must be between 1 and ${visible.length}` });
      ({ args, expected } = visible[n - 1]);
      label = `Example ${n}`;
    } else if (kind === "failing") {
      const last = await Submission.findOne({ learnerId, problem: slug, mode: "submit", revealedTest: { $exists: true, $ne: null } }).sort({ createdAt: -1 }).lean();
      const test = last ? await TestCase.findOne({ problem: slug, idx: last.revealedTest.idx }).lean() : null;
      if (!test) return res.status(404).json({ error: "There is no failing hidden test to step through yet. Submit first." });
      ({ args, expected } = test);
      label = "The failing hidden test";
    } else {
      const checked = validateCustomArgs(params, source.args);
      if (!checked.ok) return res.status(400).json({ error: checked.error });
      args = checked.args;
      label = "Your input";
    }

    if (!limiter.take(learnerId).ok) return res.status(429).json({ error: "You have stepped through a lot of runs in the last hour. Try again a little later." });

    const run = await runTrace({ code, signature: problem.signature, args, learnerId });
    const result = run.ok ? run.trace.result : null;
    const matched = run.ok && kind !== "custom" && result?.k === "returned" ? JSON.stringify(plainValue(result.v)) === JSON.stringify(expected) : undefined;
    await DebugRun.create({
      learnerId, problem: slug, sourceKind: kind, sourceIndex: kind === "example" ? Number(source.index) : undefined,
      codeHash: createHash("sha256").update(code).digest("hex"), ok: run.ok, reason: run.ok ? undefined : run.reason,
      steps: run.ok ? run.trace.steps.length : undefined, calls: run.ok ? run.trace.calls.length : undefined, truncated: run.ok ? run.trace.truncated ?? undefined : undefined,
      resultKind: result?.k, errorName: result?.t, matchedExpected: matched, timeSec: run.ok ? run.timeSec : undefined, version: DEBUG_VERSION,
    }).catch((err) => console.error("could not log a debug run:", err.message)); // a logging failure must not break the learner's debugging

    if (!run.ok) {
      const messages = {
        time_limit: "The run took too long to trace. Look for a loop that never ends, or try a smaller input.",
        no_trace: "The run did not produce a trace. Try again; if it keeps happening, the code may be stopping the program itself.",
        bad_trace: "The trace could not be read. Try again.",
      };
      return res.status(422).json({ error: messages[run.reason] ?? "The run could not be traced.", detail: run.message ?? null });
    }
    res.json({ label, kind, params, args, expected: kind === "custom" ? undefined : expected, trace: run.trace, timeSec: run.timeSec, maxSteps: 2000 });
  } catch (err) {
    if (/Judge0|fetch failed|aborted|timeout/i.test(String(err?.message))) return res.status(503).json({ error: "The code runner is not available right now. Try again in a moment." });
    next(err);
  }
});

export default router;
