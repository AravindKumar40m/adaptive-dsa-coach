import { Router } from "express";
import { config } from "../config.js";
import { RecommendationEvent } from "../models/RecommendationEvent.js";
import { Submission } from "../models/Submission.js";
import { PlacementQuiz } from "../models/PlacementQuiz.js";
import { PlacementSurvey } from "../models/PlacementSurvey.js";
import { touchSession } from "../logging/sessions.js";
import { PICKER_VERSION, RECOMMENDER2_VERSION } from "../core/versions.js";
import { createModel } from "../kt/models.js";
import { SHADOW_PARAMS } from "../kt/params.js";
import { shadowCatalog, toLearner } from "../kt/shadow.js";
import { KnowledgeState } from "../models/KnowledgeState.js";
import { policyFor } from "../recommend/policy.js";
import { pickNextV2, slotFor } from "../recommend/recommender2.js";
import { loadLearnerState } from "../skill/learnerState.js";
import { conceptStatus, pickNext } from "../recommend/picker.js";
import { loadSolveHistory } from "../skill/history.js";
import { REVIEW_COOLDOWN_PICKS, pickReview, reviewStates } from "../recommend/review.js";
import { START_RATING } from "../skill/skill.js";
import { loadProgress } from "../insights/loadProgress.js";

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

// The progress page: skills, strongest/weakest topic, mistakes, help used, reviews due, pace (insights/progress.js).
// It only reshapes data that is already logged.
router.get("/learners/:learnerId/progress", async (req, res, next) => {
  try {
    if (!ID_PATTERN.test(req.params.learnerId)) return res.status(400).json({ error: "bad learner id" });
    res.json(await loadProgress(req.params.learnerId));
  } catch (err) {
    next(err);
  }
});

// The next problem for this learner. ?exclude=slug1,slug2 lists problems the learner skipped.
router.get("/learners/:learnerId/next", async (req, res, next) => {
  try {
    if (!ID_PATTERN.test(req.params.learnerId)) return res.status(400).json({ error: "bad learner id" });
    const exclude = new Set(String(req.query.exclude ?? "").split(",").filter(Boolean).slice(0, 100));
    const learnerId = req.params.learnerId;
    const state = await loadLearnerState(learnerId);
    const policy = policyFor(learnerId); // v1 or v2 (see policy.js)

    // The same state gets the same pick: revisiting the page must not reshuffle a recommendation (and not log it twice).
    // "State" = the learner's latest Submit, the list of skipped problems, and the placement quiz / self-assessment they last
    // finished (they change ratings and unlocks, so a pick made before them must not be reused afterwards).
    const [lastSubmit, lastQuiz, survey] = await Promise.all([
      Submission.findOne({ learnerId, mode: "submit" }).sort({ createdAt: -1 }).select("_id").lean(),
      PlacementQuiz.findOne({ learnerId, status: "finished" }).sort({ finishedAt: -1 }).select("_id").lean(),
      PlacementSurvey.findOne({ learnerId }).select("updatedAt -_id").lean(),
    ]);
    const stateKey = `${lastSubmit?._id ?? "none"}|${[...exclude].sort().join(",")}|q${lastQuiz?._id ?? "-"}|s${survey?.updatedAt?.getTime() ?? "-"}`;
    const prev = await RecommendationEvent.findOne({ learnerId }).sort({ createdAt: -1 }).lean();
    if (prev && !prev.done && (prev.policy ?? "v1") === policy && prev.stateKey === stateKey && Date.now() - prev.createdAt.getTime() < 6 * 3600 * 1000 && (prev.mode === "review" || !state.solved.has(prev.chosen.slug))) { // a repeat review is a solved problem on purpose
      const problem = state.problems.find((p) => p.slug === prev.chosen.slug);
      if (problem) {
        return res.json({ done: false, problem, expectedSuccess: prev.chosen.expectedSuccess, mode: prev.mode, reason: prev.reason, repeated: prev.repeated, explored: prev.explored, recommendationId: prev._id, reused: true, policy, slot: prev.v2?.slot ?? null, review: prev.review ?? null });
      }
    }

    const sessionId = await touchSession(learnerId).catch(() => null);
    let pick, v2info = null;
    if (policy === "v2") {
      // the new recommender: it reads the knowledge model's memory of this learner (see recommender2.js)
      const model = createModel("kt-full", SHADOW_PARAMS, await shadowCatalog());
      model.difficultyProvider = (item) => state.difficulty.get(item.slug) ?? item.seed; // the live, drifted difficulty
      const L = toLearner(model, await KnowledgeState.findOne({ learnerId }).lean());
      const attemptsInSession = sessionId ? await Submission.countDocuments({ learnerId, sessionId, mode: "submit" }) : 0;
      const r = pickNextV2({ concepts: state.concepts, problems: state.problems, solved: state.solved, placed: state.placed, exclude, model, L, now: Date.now(), slot: slotFor(attemptsInSession) });
      pick = r.done ? r : { ...r, expectedSuccess: r.p, mode: "v2" };
      v2info = r.done ? null : { slot: r.slot, target: r.target, score: r.score, parts: r.parts, warmup: r.warmup };
    } else {
      // v1: first, is any topic due for a spaced review? (review.js; never more than 1 review in 3 recommendations)
      const now = Date.now();
      const solves = await loadSolveHistory(learnerId, state.problems);
      const states = reviewStates(solves, now);
      if (config.pickerReview) {
        const recent = await RecommendationEvent.find({ learnerId }).sort({ createdAt: -1 }).limit(REVIEW_COOLDOWN_PICKS).select("mode -_id").lean();
        if (!recent.some((r) => r.mode === "review")) {
          const solveInfo = new Map();
          for (const s of solves) solveInfo.set(s.problem, s); // oldest first, so the latest solve of each problem wins
          pick = pickReview({ states, concepts: state.concepts, problems: state.problems, difficulty: state.difficulty, ratings: state.ratings, solved: state.solved, exclude, solveInfo, status: conceptStatus(state) });
        }
      }
      pick ??= pickNext({ ...state, exclude, explore: { rate: config.pickerExploreRate }, history: { last: new Map([...states].map(([c, s]) => [c, s.last])), now } });
    }

    // log the decision (a logging failure must not stop the learner getting a problem)
    let recommendationId = null;
    try {
      const base = { learnerId, sessionId, pickerVersion: policy === "v2" ? RECOMMENDER2_VERSION : PICKER_VERSION, policy, stateKey, exploreRate: policy === "v2" ? null : config.pickerExploreRate, solvedCount: state.solved.size, excludeCount: exclude.size, reason: pick.reason };
      const row = await RecommendationEvent.create(pick.done ? { ...base, done: true } : {
        ...base, done: false, mode: pick.mode, explored: pick.explored, propensity: pick.propensity, greedySlug: pick.greedySlug, repeated: pick.repeated,
        chosen: { slug: pick.problem.slug, concept: pick.problem.concept, difficultyLabel: pick.problem.difficulty, expectedSuccess: pick.expectedSuccess, conceptRating: state.ratings.get(pick.problem.concept) ?? START_RATING },
        candidates: pick.candidates, fitsCount: pick.fitsCount, poolSize: pick.poolSize, openCount: pick.openCount, v2: v2info, review: pick.review ?? undefined,
      });
      recommendationId = row._id;
    } catch (err) {
      console.error("could not log recommendation:", err.message);
    }
    if (pick.done) return res.json({ done: true, reason: pick.reason });
    res.json({
      done: false,
      problem: pick.problem, // { slug, title, concept, difficulty, rating }
      expectedSuccess: pick.expectedSuccess,
      mode: pick.mode,
      reason: pick.reason,
      repeated: pick.repeated,
      explored: pick.explored,
      recommendationId,
      policy,
      slot: v2info?.slot ?? null,
      review: pick.review ?? null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
