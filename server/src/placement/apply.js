// Database side of the placement quiz: turns a finished quiz into starting ratings.
// RULE: real practice always beats the quiz. A topic where the learner already has counted attempts is left alone.
import { SHADOW_PARAMS } from "../kt/params.js";
import { KnowledgeState } from "../models/KnowledgeState.js";
import { SkillRating } from "../models/SkillRating.js";

/**
 * @param {{learnerId:string, topics:{concept:string, rating:number}[]}} a   topics = scoreQuiz(...).topics
 * @returns {Promise<{applied:string[], kept:string[]}>} applied = ratings set from the quiz, kept = topics left alone
 */
export async function applyQuizRatings({ learnerId, topics }) {
  const existing = await SkillRating.find({ learnerId }).select("concept attempts -_id").lean();
  const attempts = new Map(existing.map((r) => [r.concept, r.attempts ?? 0]));
  const applied = [], kept = [];
  for (const t of topics) {
    if ((attempts.get(t.concept) ?? 0) > 0) { kept.push(t.concept); continue; }
    await SkillRating.updateOne({ learnerId, concept: t.concept }, { $set: { rating: t.rating, attempts: 0, source: "placement" } }, { upsert: true });
    applied.push(t.concept);
  }
  // the knowledge model (shadow mode) gets the same starting guess for skills it has no real attempts for
  if (applied.length) {
    const state = await KnowledgeState.findOne({ learnerId }).lean();
    const set = {};
    for (const t of topics) {
      if (!applied.includes(t.concept)) continue;
      if ((state?.skills?.[t.concept]?.n ?? 0) > 0) continue;
      set[`skills.${t.concept}`] = { theta: t.rating, v: SHADOW_PARAMS.sd0 ** 2, n: 0, last: null };
    }
    if (Object.keys(set).length) await KnowledgeState.updateOne({ learnerId }, { $set: set, $setOnInsert: { attempts: 0, recent: [] } }, { upsert: true });
  }
  return { applied, kept };
}
