// Shadow mode: the new knowledge model runs silently next to the live Elo on every learner's first gradable Submit on a problem.
// It logs BOTH predictions (made before the result is known) with the outcome, and keeps its own memory of each learner.
// It never changes a rating, a recommendation or anything the learner sees. A failure here must never break a Submit.
import { config } from "../config.js";
import { KnowledgeState } from "../models/KnowledgeState.js";
import { ModelPrediction } from "../models/ModelPrediction.js";
import { Problem } from "../models/Problem.js";
import { ProblemDifficulty } from "../models/ProblemDifficulty.js";
import { SkillRating } from "../models/SkillRating.js";
import { START_RATING, expectedScore } from "../skill/skill.js";
import { KT_VERSION } from "../core/versions.js";
import { buildCatalog, createModel } from "./models.js";
import { SHADOW_PARAMS } from "./params.js";
export { SHADOW_PARAMS };


let catalogCache = null;
async function catalog() {
  if (catalogCache && Date.now() - catalogCache.at < 10 * 60 * 1000) return catalogCache.value;
  const problems = await Problem.find().select("slug concept rating skills -_id").lean();
  catalogCache = { at: Date.now(), value: buildCatalog(problems) };
  return catalogCache.value;
}

export { catalog as shadowCatalog };

export const toLearner = (model, doc) => {
  const L = model.newLearner();
  for (const [concept, s] of Object.entries(doc?.skills ?? {})) L.skills.set(concept, { ...s });
  L.attempts = doc?.attempts ?? 0;
  L.recent = doc?.recent ?? [];
  return L;
};
export const fromLearner = (L) => ({ skills: Object.fromEntries(L.skills), attempts: L.attempts, recent: L.recent ?? [] });

/**
 * @param {{learnerId, problem, graded:{verdict}, history:{alreadySolved, failsBefore}, submissionId, sessionId, now?}} s
 *   call BEFORE the production rating is updated, so both models see the same "before" state
 * @returns the logged row, or null when this Submit is not a first gradable Submit
 */
export async function recordShadow({ learnerId, problem, graded, history, submissionId, sessionId, now = Date.now() }) {
  if (!config.ktShadow) return null;
  if (graded.verdict === "compile_error" || graded.verdict === "internal_error") return null; // says nothing about the skill
  if (history.alreadySolved || history.failsBefore > 0) return null; // only the FIRST gradable Submit is a clean "can they do it cold?" label

  const model = createModel("kt-full", SHADOW_PARAMS, await catalog());
  const [rating, diff, state] = await Promise.all([
    SkillRating.findOne({ learnerId, concept: problem.concept }).lean(),
    ProblemDifficulty.findOne({ problem: problem.slug }).lean(),
    KnowledgeState.findOne({ learnerId }).lean(),
  ]);
  const difficulty = diff?.difficulty ?? problem.rating; // the live, drifted difficulty production uses
  model.difficultyProvider = () => difficulty;

  const L = toLearner(model, state);
  const event = { slug: problem.slug, t: now };
  const kt = model.predict(L, event);
  const elo = expectedScore(rating?.rating ?? START_RATING, difficulty);
  const y = graded.verdict === "accepted" ? 1 : 0;

  model.update(L, event, y);
  await KnowledgeState.updateOne({ learnerId }, { $set: { ...fromLearner(L), modelVersion: KT_VERSION } }, { upsert: true });
  return ModelPrediction.create({ learnerId, problem: problem.slug, submissionId, sessionId, t: now, y, elo, kt, difficulty, modelVersion: KT_VERSION, params: SHADOW_PARAMS });
}
