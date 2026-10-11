import { createHash } from "node:crypto";
import { Router } from "express";
import { LANGUAGES } from "../languages.js";
import { CodeSnapshot } from "../models/CodeSnapshot.js";
import { Problem } from "../models/Problem.js";
import { makeLimiter } from "../rateLimit.js";
import { touchSession } from "../sessions.js";
import { LOGGING_VERSION } from "../versions.js";

const router = Router();
const MAX_CODE_CHARS = 20000;
export const MAX_SNAPSHOTS_PER_PROBLEM = 400; // about 3 hours of work at one every 30 s: a hard stop on one noisy problem
const limiter = makeLimiter(240, 3600 * 1000); // a page saving every 30 s sends 120 an hour; double that is the ceiling
const ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

// The page saves the learner's code every ~30 s when it changed. Same code twice in a row is not stored twice.
// body: { problem, language, code, trigger: "timer"|"switch", msSinceOpen }
router.post("/snapshot", async (req, res, next) => {
  try {
    const { learnerId, problem: slug, language, code, trigger, msSinceOpen } = req.body ?? {};
    if (!ID_PATTERN.test(learnerId ?? "")) return res.status(400).json({ error: "bad learner id" });
    if (!LANGUAGES[language]) return res.status(400).json({ error: `language must be one of: ${Object.keys(LANGUAGES).join(", ")}` });
    if (typeof code !== "string" || code.trim() === "") return res.status(400).json({ error: "code is empty" });
    if (code.length > MAX_CODE_CHARS) return res.status(400).json({ error: `code is longer than ${MAX_CODE_CHARS} characters` });
    if (!["timer", "switch"].includes(trigger)) return res.status(400).json({ error: "trigger must be timer or switch" });
    if (typeof slug !== "string" || !(await Problem.exists({ slug }))) return res.status(404).json({ error: "problem not found" });
    if (!limiter.take(learnerId).ok) return res.status(429).json({ error: "Too many snapshots. Slow down a little." });

    const hash = createHash("sha256").update(code).digest("hex");
    const last = await CodeSnapshot.findOne({ learnerId, problem: slug, language }).sort({ createdAt: -1 }).select("hash seq -_id").lean();
    if (last?.hash === hash) return res.json({ stored: false, reason: "unchanged" });
    const count = await CodeSnapshot.countDocuments({ learnerId, problem: slug });
    if (count >= MAX_SNAPSHOTS_PER_PROBLEM) return res.json({ stored: false, reason: "limit" });

    await CodeSnapshot.create({
      learnerId, problem: slug, language, code, chars: code.length, hash, trigger, seq: count + 1,
      msSinceOpen: Number.isFinite(msSinceOpen) ? Math.min(Math.max(Math.round(msSinceOpen), 0), 6 * 3600_000) : undefined,
      sessionId: await touchSession(learnerId).catch(() => null), loggingVersion: LOGGING_VERSION,
    });
    res.status(201).json({ stored: true, seq: count + 1 });
  } catch (err) {
    next(err);
  }
});

export default router;
