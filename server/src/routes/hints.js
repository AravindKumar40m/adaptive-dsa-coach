import { Router } from "express";
import { createHash } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";
import { aiConsentCurrent } from "../auth.js";
import { FEEDBACK_LEVEL, revealNext, revealedHints } from "../hints.js";
import { explainResult, llmConfigured, summarizeResult } from "../llm.js";
import { makeLimiter } from "../rateLimit.js";
import { AiFeedbackCache } from "../models/AiFeedbackCache.js";
import { HintEvent } from "../models/HintEvent.js";
import { Problem } from "../models/Problem.js";
import { LANGUAGES } from "../languages.js";

const router = Router();
const ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;
const MAX_CODE_CHARS = 20000;
const limiter = makeLimiter(config.aiCallsPerHour);
const PENALTY_NOTE = "Hints lower the independence part of your skill score for this problem.";

// Is the AI explanation switched on? (the page hides its button when not)
router.get("/ai/status", (_req, res) => res.json({ enabled: llmConfigured() }));

// Ladder hints this learner has already revealed on a problem (so a page refresh shows them again for free).
router.get("/learners/:learnerId/hints/:slug", async (req, res, next) => {
  try {
    if (!ID_PATTERN.test(req.params.learnerId)) return res.status(400).json({ error: "bad learner id" });
    const problem = await Problem.findOne({ slug: req.params.slug }).select("slug hints").lean();
    if (!problem) return res.status(404).json({ error: "problem not found" });
    res.json({ ...(await revealedHints(req.params.learnerId, problem)), maxLevel: 4, note: PENALTY_NOTE });
  } catch (err) {
    next(err);
  }
});

// Reveal the next ladder level (one at a time; asking again after level 4 just returns what was revealed).
router.post("/hint", async (req, res, next) => {
  try {
    const { learnerId, problem: slug } = req.body ?? {};
    if (!ID_PATTERN.test(learnerId ?? "")) return res.status(400).json({ error: "learnerId must be 8-64 letters, digits or dashes" });
    const problem = await Problem.findOne({ slug }).select("slug hints").lean();
    if (!problem) return res.status(404).json({ error: "problem not found" });
    res.json({ ...(await revealNext(learnerId, problem)), maxLevel: 4, note: PENALTY_NOTE });
  } catch (err) {
    next(err);
  }
});

// "Explain my result": the AI explains what probably went wrong. Never the full solution.
router.post("/feedback", async (req, res, next) => {
  try {
    if (!llmConfigured()) return res.status(503).json({ error: "AI feedback is not set up on this server." });
    if (!aiConsentCurrent(req.user)) {
      return res.status(403).json({ error: "Turn on AI explanations in your Account menu first: they send your code to Anthropic.", needsAiConsent: true });
    }
    const { learnerId, problem: slug, language, code, result } = req.body ?? {};
    if (!ID_PATTERN.test(learnerId ?? "")) return res.status(400).json({ error: "learnerId must be 8-64 letters, digits or dashes" });
    if (!LANGUAGES[language]) return res.status(400).json({ error: `language must be one of: ${Object.keys(LANGUAGES).join(", ")}` });
    if (typeof code !== "string" || code.trim() === "") return res.status(400).json({ error: "code is empty" });
    if (code.length > MAX_CODE_CHARS) return res.status(400).json({ error: `code is longer than ${MAX_CODE_CHARS} characters` });
    const problem = await Problem.findOne({ slug }).lean();
    if (!problem) return res.status(404).json({ error: "problem not found" });

    const summary = summarizeResult(result);
    const key = createHash("sha256").update(JSON.stringify([slug, language, code, summary])).digest("hex");
    let text = (await AiFeedbackCache.findOne({ key }).lean())?.text;
    let source = "cache";
    if (!text) {
      const turn = limiter.take(learnerId);
      if (!turn.ok) return res.status(429).json({ error: `You have used all ${config.aiCallsPerHour} AI explanations for this hour. Try again in ${Math.ceil(turn.retryAfterSec / 60)} minutes.` });
      try {
        text = await explainResult({ problem, language, code, summary });
      } catch (err) {
        console.error("AI feedback failed:", err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : err.message);
        const busy = err instanceof Anthropic.RateLimitError || err.status === 529;
        return res.status(busy ? 503 : 502).json({ error: busy ? "The AI tutor is busy right now. Try again in a minute." : "The AI tutor is unavailable right now." });
      }
      source = "llm";
      await AiFeedbackCache.updateOne({ key }, { $setOnInsert: { key, text } }, { upsert: true });
    }
    await HintEvent.create({ learnerId, problem: slug, kind: "feedback", level: FEEDBACK_LEVEL, source, text });
    res.json({ text, source, note: PENALTY_NOTE });
  } catch (err) {
    next(err);
  }
});

export default router;
