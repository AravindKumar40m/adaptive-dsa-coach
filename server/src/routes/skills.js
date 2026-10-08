import { Router } from "express";
import { loadLearnerState } from "../learnerState.js";
import { conceptStatus, pickNext } from "../picker.js";
import { START_RATING } from "../skill.js";

const router = Router();
const ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

// A learner's rating per concept, plus how many problems they solved and whether the concept is unlocked.
router.get("/learners/:learnerId/skills", async (req, res, next) => {
  try {
    if (!ID_PATTERN.test(req.params.learnerId)) return res.status(400).json({ error: "bad learner id" });
    const state = await loadLearnerState(req.params.learnerId);
    const status = conceptStatus(state);
    res.json({
      startRating: START_RATING,
      solvedProblems: [...state.solved], // slugs the learner has solved (the problem library shows a tick for these)
      skills: state.concepts.map((c) => ({
        concept: c.key, name: c.name, prerequisites: c.prerequisites,
        rating: state.ratings.get(c.key) ?? START_RATING,
        attempts: state.attempts.get(c.key) ?? 0,
        solved: status.get(c.key).solved,
        total: status.get(c.key).total,
        unlocked: status.get(c.key).unlocked,
        missing: status.get(c.key).missing, // prerequisite concepts still to finish
      })),
    });
  } catch (err) {
    next(err);
  }
});

// The next problem for this learner. ?exclude=slug1,slug2 lists problems the learner skipped.
router.get("/learners/:learnerId/next", async (req, res, next) => {
  try {
    if (!ID_PATTERN.test(req.params.learnerId)) return res.status(400).json({ error: "bad learner id" });
    const exclude = new Set(String(req.query.exclude ?? "").split(",").filter(Boolean).slice(0, 100));
    const state = await loadLearnerState(req.params.learnerId);
    const pick = pickNext({ ...state, exclude });
    if (pick.done) return res.json({ done: true, reason: pick.reason });
    res.json({
      done: false,
      problem: pick.problem, // { slug, title, concept, difficulty, rating }
      expectedSuccess: pick.expectedSuccess,
      mode: pick.mode,
      reason: pick.reason,
      repeated: pick.repeated,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
