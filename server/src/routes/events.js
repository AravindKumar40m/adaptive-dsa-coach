import { Router } from "express";
import { makeLimiter } from "../core/rateLimit.js";
import { Problem } from "../models/Problem.js";
import { Submission } from "../models/Submission.js";
import { ProblemEvent, PROBLEM_EVENT_KINDS } from "../models/ProblemEvent.js";
import { RecommendationEvent } from "../models/RecommendationEvent.js";
import { touchSession } from "../logging/sessions.js";

const router = Router();
const limiter = makeLimiter(400, 3600 * 1000); // events per learner per hour: far above real use, stops floods
const ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

// what each kind of event may carry
const VALID = {
  opened: (v) => ["rec", "library", "direct"].includes(v),
  confidence: (v) => Number.isInteger(v) && v >= 1 && v <= 5,
  feel: (v) => ["too_easy", "just_right", "too_hard"].includes(v),
  liked: (v) => typeof v === "boolean",
  skipped: (v) => ["too_hard", "too_easy", "not_interested", "other", "no_reason"].includes(v),
  nudge_shown: () => false, // only the server writes this (nudge.js); a browser cannot invent an offer
  nudge_taken: (v) => v === "hints",
  nudge_dismissed: (v) => v === "not_now",
};
const DAY = 24 * 3600 * 1000;

// The recommendation that offered this problem (the latest one in the last day), so choices can be compared with offers.
async function offeredBy(learnerId, slug) {
  const rec = await RecommendationEvent.findOne({ learnerId, "chosen.slug": slug, createdAt: { $gte: new Date(Date.now() - DAY) } }).sort({ createdAt: -1 }).select("_id").lean();
  return rec?._id ?? null;
}

// The learner opened a problem, skipped it, or told us how it felt.   body: { problem, kind, value }
router.post("/problem-event", async (req, res, next) => {
  try {
    const { learnerId, problem: slug, kind, value } = req.body ?? {};
    if (!ID_PATTERN.test(learnerId ?? "")) return res.status(400).json({ error: "bad learner id" });
    if (!PROBLEM_EVENT_KINDS.includes(kind)) return res.status(400).json({ error: `kind must be one of: ${PROBLEM_EVENT_KINDS.join(", ")}` });
    if (!VALID[kind](value)) return res.status(400).json({ error: `that is not a valid value for "${kind}"` });
    if (!limiter.take(learnerId).ok) return res.status(429).json({ error: "Too many events. Slow down a little." });
    if (typeof slug !== "string" || !(await Problem.exists({ slug }))) return res.status(404).json({ error: "problem not found" });
    const [sessionId, recommendationId] = await Promise.all([
      touchSession(learnerId).catch(() => null),
      kind === "opened" || kind === "skipped" ? offeredBy(learnerId, slug) : null,
    ]);
    const row = await ProblemEvent.create({ learnerId, problem: slug, kind, value, sessionId, ...(recommendationId ? { recommendationId } : {}) });
    res.status(201).json({ ok: true, id: row._id });
  } catch (err) {
    next(err);
  }
});

// What the learner already told us about this problem (the page shows it as selected after a reload).
router.get("/learners/:learnerId/problem-state/:slug", async (req, res, next) => {
  try {
    if (!ID_PATTERN.test(req.params.learnerId)) return res.status(400).json({ error: "bad learner id" });
    const out = {};
    for (const kind of ["confidence", "feel", "liked"]) {
      const row = await ProblemEvent.findOne({ learnerId: req.params.learnerId, problem: req.params.slug, kind }).sort({ createdAt: -1 }).select("value -_id").lean();
      out[kind] = row ? row.value : null;
    }
    out.runs = await Submission.countDocuments({ learnerId: req.params.learnerId, problem: req.params.slug }); // the page hides the "confidence" question once code was run
    res.json(out);
  } catch (err) {
    next(err);
  }
});

export default router;
