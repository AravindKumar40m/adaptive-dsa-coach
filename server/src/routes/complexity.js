import { Router } from "express";
import mongoose from "mongoose";
import { COMPLEXITY_VERSION } from "../core/versions.js";
import { makeLimiter } from "../core/rateLimit.js";
import { runComplexity } from "../complexity/run.js";
import { ComplexityConfig } from "../models/ComplexityConfig.js";
import { ComplexityMeasurement } from "../models/ComplexityMeasurement.js";
import { Submission } from "../models/Submission.js";

// "How does my solution scale?" (rules in complexity/analyze.js). Only for a CORRECT Python Submit of a problem we have a
// size generator for. The code that is measured is the one stored with the Submit, never code sent along by the browser.
const router = Router();
const limiter = makeLimiter(30, 3600 * 1000); // analyses per learner per hour: each one runs for a few seconds in the sandbox

const asMs = (ns) => Math.round(ns / 1000) / 1000;
function payload(m, cached = false) {
  return {
    cached, verdict: m.verdict, label: m.label, exponent: m.exponent ?? null, exponential: Boolean(m.exponential), factor: m.factor ?? null,
    expected: m.expected, measuredUpTo: m.measuredUpTo ?? null, message: m.message,
    points: (m.points ?? []).map((p) => ({ n: p.n, ms: asMs(p.ns) })),
  };
}

// body: { submission: <the id returned by POST /submit> }
router.post("/complexity", async (req, res, next) => {
  try {
    const { learnerId, submission: submissionId } = req.body ?? {};
    if (!mongoose.isValidObjectId(submissionId)) return res.status(400).json({ error: "bad submission id" });
    const sub = await Submission.findOne({ _id: submissionId, learnerId, mode: "submit" }).lean();
    if (!sub) return res.status(404).json({ error: "That Submit was not found." });
    if (sub.verdict !== "accepted") return res.status(422).json({ error: "Only a correct solution can be measured." });
    if (sub.language !== "python") return res.status(422).json({ error: "The scaling check is available for Python solutions for now." });
    const config = await ComplexityConfig.findOne({ problem: sub.problem }).lean();
    if (!config) return res.status(422).json({ error: "The scaling check is not available for this problem yet." });

    const existing = await ComplexityMeasurement.findOne({ learnerId, submissionId }).lean();
    if (existing) return res.json(payload(existing, true)); // the same Submit is measured once
    if (!limiter.take(learnerId).ok) return res.status(429).json({ error: "You have measured a lot of solutions in the last hour. Try again a little later." });

    const run = await runComplexity({ code: sub.code, config, learnerId });
    const a = run.analysis;
    const row = {
      learnerId, problem: sub.problem, language: sub.language, submissionId, verdict: a.verdict, label: a.label, exponent: a.exponent ?? undefined, r2: a.r2 ?? undefined,
      exponential: a.exponential, factor: a.factor ?? undefined, expected: a.expected, measuredUpTo: a.measuredUpTo ?? undefined,
      points: run.points, error: run.error ?? undefined, judgeStatus: run.judgeStatus, wallMs: run.wallMs, message: a.message,
      version: COMPLEXITY_VERSION, configVersion: config.configVersion,
    };
    try {
      await ComplexityMeasurement.create(row);
    } catch (err) {
      if (err.code === 11000) return res.json(payload(await ComplexityMeasurement.findOne({ learnerId, submissionId }).lean(), true)); // a double click: the other request won
      throw err;
    }
    res.status(201).json(payload(row));
  } catch (err) {
    if (/Judge0|fetch failed|aborted|timeout/i.test(String(err?.message))) return res.status(503).json({ error: "The code runner is not available right now. Try again in a moment." });
    next(err);
  }
});

export default router;
