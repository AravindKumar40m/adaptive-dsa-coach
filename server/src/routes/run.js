import { Router } from "express";
import { LANGUAGES } from "../languages.js";
import { gradeCode } from "../grader.js";
import { decodeValue } from "../harness.js";
import { Problem } from "../models/Problem.js";
import { TestCase } from "../models/TestCase.js";
import { Submission } from "../models/Submission.js";
import { eraseLearnerData } from "../erase.js";
import { applySubmission, priorHistory, secondsSince } from "../rating.js";

const router = Router();

// "12" / "3 1 2 3" / hex -> the plain value the learner's function returned (errors like ERR:BadType stay as text)
function showActual(type, encoded) {
  if (encoded == null || encoded.startsWith("ERR:")) return encoded;
  try { return decodeValue(type, encoded); } catch { return encoded; }
}
const MAX_CODE_CHARS = 20000;
const ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

// Run = only the visible example tests (fast feedback). Submit = every test; hidden ones show pass/fail only.
async function handle(mode, req, res) {
  const { learnerId, problem: slug, language, code, startedAt } = req.body ?? {};
  if (!ID_PATTERN.test(learnerId ?? "")) return res.status(400).json({ error: "learnerId must be 8-64 letters, digits or dashes" });
  if (!LANGUAGES[language]) return res.status(400).json({ error: `language must be one of: ${Object.keys(LANGUAGES).join(", ")}` });
  if (typeof code !== "string" || code.trim() === "") return res.status(400).json({ error: "code is empty" });
  if (code.length > MAX_CODE_CHARS) return res.status(400).json({ error: `code is longer than ${MAX_CODE_CHARS} characters` });

  const problem = await Problem.findOne({ slug }).lean();
  if (!problem) return res.status(404).json({ error: "problem not found" });
  const filter = mode === "run" ? { problem: slug, visible: true } : { problem: slug };
  const tests = await TestCase.find(filter).sort({ idx: 1 }).lean();

  const secondsSpent = secondsSince(startedAt);
  const history = mode === "submit" ? await priorHistory(learnerId, slug) : null; // must be read before this submission is logged
  const started = Date.now();
  let graded;
  try {
    graded = await gradeCode({ language, code, signature: problem.signature, tests });
  } catch (err) {
    console.error("grading failed:", err.message);
    return res.status(503).json({ error: "The code runner is not available right now. Try again in a moment." });
  }
  const durationMs = Date.now() - started;

  const passed = graded.tests.filter((t) => t.verdict === "passed").length;
  const total = tests.length;

  // log every run/submit; a logging failure must not break the learner's result
  let submissionId = null;
  try {
    const row = await Submission.create({
      learnerId, problem: slug, language, mode, code, secondsSpent, startedAt: secondsSpent == null ? undefined : new Date(startedAt),
      verdict: graded.verdict, passed, total,
      perTest: graded.tests.map(({ idx, verdict }) => ({ idx, verdict })),
      timeSec: graded.timeSec, memoryKb: graded.memoryKb,
      compileOutput: graded.compileOutput?.slice(0, 2000), stderr: graded.stderr?.slice(0, 1500), durationMs,
    });
    submissionId = row._id;
  } catch (err) {
    console.error("could not log submission:", err.message);
  }

  // Only Submit moves the skill rating (Run never does). A failure here must not hide the learner's result.
  let skill = null;
  if (mode === "submit") {
    try {
      skill = await applySubmission({ learnerId, problem, graded, passed, total, history, secondsSpent, submissionId });
    } catch (err) {
      console.error("could not update skill rating:", err.message);
    }
  }

  // what the learner may see: full detail for visible tests, verdict only for hidden ones
  const byIdx = new Map(tests.map((t) => [t.idx, t]));
  const shown = graded.tests.map((r) => {
    const t = byIdx.get(r.idx);
    return t.visible
      ? { visible: true, verdict: r.verdict, args: t.args, expected: t.expected, actual: showActual(problem.signature.returns, r.actual) }
      : { visible: false, verdict: r.verdict };
  });
  res.json({
    mode, problem: slug, verdict: graded.verdict, passed, total,
    tests: shown,
    compileOutput: graded.compileOutput, stdout: graded.stdout, stderr: graded.stderr,
    timeSec: graded.timeSec, memoryKb: graded.memoryKb,
    skill,
  });
}

router.post("/run", (req, res, next) => handle("run", req, res).catch(next));
router.post("/submit", (req, res, next) => handle("submit", req, res).catch(next));

// Learners can delete everything we logged about them (consent / data deletion decision in CLAUDE.md).
router.delete("/learners/:learnerId/data", async (req, res, next) => {
  try {
    if (!ID_PATTERN.test(req.params.learnerId)) return res.status(400).json({ error: "bad learner id" });
    res.json(await eraseLearnerData(req.params.learnerId)); // guardLearner already checked it is the caller's own id
  } catch (err) {
    next(err);
  }
});

export default router;
