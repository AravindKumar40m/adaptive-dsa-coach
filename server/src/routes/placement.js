import { Router } from "express";
import { SHADOW_PARAMS } from "../kt/params.js";
import { KnowledgeState } from "../models/KnowledgeState.js";
import { Concept } from "../models/Concept.js";
import { PlacementSurvey } from "../models/PlacementSurvey.js";

const router = Router();
const ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;
export const SURVEY_POINTS_PER_STEP = 30; // a self-rating of 4 ("could teach it") starts a skill 60 rating points above 3's baseline 2: 1000 + 30 * (answer - 2)

router.get("/learners/:learnerId/placement", async (req, res, next) => {
  try {
    if (!ID_PATTERN.test(req.params.learnerId)) return res.status(400).json({ error: "bad learner id" });
    const row = await PlacementSurvey.findOne({ learnerId: req.params.learnerId }).lean();
    res.json({ done: Boolean(row), answers: row?.answers ?? {}, experience: row?.experience ?? null });
  } catch (err) {
    next(err);
  }
});

// Save the self-assessment (it can be redone) and turn it into a weak starting guess for skills the learner has not practised yet.
//   body: { answers: { <concept>: 0..4, ... }, experience: 0..3 }
router.post("/placement", async (req, res, next) => {
  try {
    const { learnerId, answers, experience } = req.body ?? {};
    if (!ID_PATTERN.test(learnerId ?? "")) return res.status(400).json({ error: "bad learner id" });
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) return res.status(400).json({ error: "answers must be an object like { arrays: 3 }" });
    const known = new Set((await Concept.find().select("key -_id").lean()).map((c) => c.key));
    const clean = {};
    for (const [concept, value] of Object.entries(answers)) {
      if (!known.has(concept)) return res.status(400).json({ error: `unknown topic: ${concept}` });
      if (!Number.isInteger(value) || value < 0 || value > 4) return res.status(400).json({ error: `the answer for ${concept} must be a whole number from 0 to 4` });
      clean[concept] = value;
    }
    if (Object.keys(clean).length === 0) return res.status(400).json({ error: "answer at least one topic" });
    if (experience != null && (!Number.isInteger(experience) || experience < 0 || experience > 3)) return res.status(400).json({ error: "experience must be a whole number from 0 to 3" });

    await PlacementSurvey.updateOne({ learnerId }, { $set: { answers: clean, experience: experience ?? null } }, { upsert: true });

    // the starting guess: only for skills with no real attempts (real outcomes always beat a self-assessment)
    const state = await KnowledgeState.findOne({ learnerId }).lean();
    const set = {};
    for (const [concept, answer] of Object.entries(clean)) {
      const existing = state?.skills?.[concept];
      if (existing && existing.n > 0) continue;
      set[`skills.${concept}`] = { theta: 1000 + SURVEY_POINTS_PER_STEP * (answer - 2), v: SHADOW_PARAMS.sd0 ** 2, n: 0, last: null };
    }
    if (Object.keys(set).length) {
      await KnowledgeState.updateOne({ learnerId }, { $set: set, $setOnInsert: { attempts: 0, recent: [] } }, { upsert: true });
    }
    res.status(201).json({ ok: true, priorsSet: Object.keys(set).map((k) => k.slice("skills.".length)) });
  } catch (err) {
    next(err);
  }
});

export default router;
