// Spaced review (rules only, no model): "what is the learner about to forget?"
// Pure functions: no database, easy to test. The database side is history.js, the HTTP side is routes/skills.js.
//
// A topic is reviewed on a schedule that stretches after each clean review: 1, 3, 7, 14, then every 30 days.
//  - The first solve in a topic starts the clock (stage 0, due after 1 day).
//  - A solve made AFTER the due time is a review. A clean one (at most hint level 2 and 2 failed submits) moves the topic
//    one stage up (longer wait); an unclean one repeats the same wait. A solve made BEFORE the due time is just extra
//    practice and does not move the schedule.
//  - So a learner who keeps practising a topic is never asked to "review" it separately: the next normal solve counts.
// When a topic is due the picker offers a REVIEW problem: a fresh problem of that topic whose chance of success is as close
// as possible to 78% (so easier than usual when the content has an easier one), so the learner rebuilds the pattern.
// If every problem of the topic is already solved, one they solved before is offered.
import { expectedScore, START_RATING } from "./skill.js";

export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30];
export const REVIEW_TARGET = 0.78; // a review should feel doable
export const REVIEW_MIN_SUCCESS = 0.55; // never hand out a hopeless "review"
export const REVIEW_COOLDOWN_PICKS = 2; // after a review, the next 2 recommendations are never reviews (at most 1 in 3)
const DAY = 86_400_000;
const LAST_STAGE = REVIEW_INTERVALS_DAYS.length - 1;

export const isCleanSolve = ({ hintLevel = 0, fails = 0 }) => hintLevel <= 2 && fails <= 2;

/**
 * One row per accepted Submit, with the help and failures that belonged to it.
 * accepted: [{problem, createdAt}]  fails: [{problem, createdAt}]  hints: [{problem, level, createdAt}]
 * problems: [{slug, concept, title}]
 * "Belonged to it" = after the previous accepted Submit of the same problem (so a repeat solve is not charged for the first one).
 */
export function buildSolves({ accepted, fails, hints, problems }) {
  const info = new Map(problems.map((p) => [p.slug, p]));
  const t = (x) => +new Date(x.createdAt);
  const out = [];
  const previous = new Map();
  for (const a of [...accepted].sort((x, y) => t(x) - t(y))) {
    const p = info.get(a.problem);
    if (!p) continue;
    const from = previous.get(a.problem) ?? -Infinity;
    const at = t(a);
    const failCount = fails.filter((f) => f.problem === a.problem && t(f) > from && t(f) < at).length;
    const hintLevel = Math.max(0, ...hints.filter((h) => h.problem === a.problem && t(h) > from && t(h) <= at).map((h) => h.level));
    out.push({ concept: p.concept, problem: a.problem, title: p.title, at, fails: failCount, hintLevel });
    previous.set(a.problem, at);
  }
  return out;
}

/** The review schedule of every topic the learner has solved something in. Map concept -> state. */
export function reviewStates(solves, now = Date.now()) {
  const states = new Map();
  for (const s of [...solves].sort((a, b) => a.at - b.at)) {
    const st = states.get(s.concept);
    if (!st) {
      states.set(s.concept, { concept: s.concept, stage: 0, reviewsDone: 0, firstAt: s.at, dueAt: s.at + REVIEW_INTERVALS_DAYS[0] * DAY, lastAt: s.at, last: s });
      continue;
    }
    if (s.at >= st.dueAt) {
      if (isCleanSolve(s)) { st.stage = Math.min(st.stage + 1, LAST_STAGE); st.reviewsDone += 1; }
      st.dueAt = s.at + REVIEW_INTERVALS_DAYS[st.stage] * DAY;
    }
    st.lastAt = s.at;
    st.last = s;
  }
  for (const st of states.values()) {
    st.intervalDays = REVIEW_INTERVALS_DAYS[st.stage];
    st.due = now >= st.dueAt;
    st.overdueRatio = (now - st.dueAt) / (st.intervalDays * DAY); // 0 = just became due, 1 = one whole interval late
    st.daysSinceLast = (now - st.lastAt) / DAY;
  }
  return states;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
export function agoText(days) {
  const d = Math.floor(days);
  return d <= 0 ? "earlier today" : d === 1 ? "yesterday" : `${d} days ago`;
}
function helpParts(s) {
  const parts = [];
  if (s.fails > 0) parts.push(plural(s.fails, "failed attempt"));
  if (s.hintLevel > 0) parts.push(`hint level ${s.hintLevel}`);
  return parts;
}

/** One plain sentence about the learner's last solve in a topic (facts only): used in the "why this problem" text. */
export function historyNote(name, last, now) {
  if (!last) return "";
  const parts = helpParts(last);
  const detail = parts.length === 0 ? ", with no help" : `, after ${parts.join(" and ")}`;
  return `Your last ${name} problem ("${last.title}") was ${agoText((now - last.at) / DAY)}${detail}.`;
}

/**
 * The review problem to offer, or null (nothing due, or nothing suitable).
 * @param {{states:Map, concepts, problems, difficulty:Map, ratings:Map, solved:Set, exclude:Set, solveInfo:Map, status:Map}} a
 *   solveInfo: problem slug -> its latest solve row (used to choose which repeat to offer)   status: conceptStatus() result
 * @returns {null | {done:false, problem, expectedSuccess, mode:"review", review, reason, repeated:false, explored:false, propensity:1, greedySlug, candidates, fitsCount, poolSize, openCount, exploreRate:0}}
 */
export function pickReview({ states, concepts, problems, difficulty, ratings, solved, exclude = new Set(), solveInfo = new Map(), status }) {
  const order = new Map(concepts.map((c, i) => [c.key, i]));
  const name = new Map(concepts.map((c) => [c.key, c.name]));
  const expected = (p) => expectedScore(ratings.get(p.concept) ?? START_RATING, difficulty.get(p.slug) ?? p.rating);
  const due = [...states.values()].filter((s) => s.due && status.get(s.concept)?.unlocked)
    .sort((a, b) => b.overdueRatio - a.overdueRatio || order.get(a.concept) - order.get(b.concept));

  for (const st of due) {
    const inConcept = problems.filter((p) => p.concept === st.concept && !exclude.has(p.slug));
    const fresh = inConcept.filter((p) => !solved.has(p.slug) && expected(p) >= REVIEW_MIN_SUCCESS)
      .sort((a, b) => Math.abs(expected(a) - REVIEW_TARGET) - Math.abs(expected(b) - REVIEW_TARGET) || (difficulty.get(a.slug) ?? a.rating) - (difficulty.get(b.slug) ?? b.rating) || a.slug.localeCompare(b.slug));
    const repeats = inConcept.filter((p) => solved.has(p.slug))
      .sort((a, b) => {
        const fa = solveInfo.get(a.slug), fb = solveInfo.get(b.slug); // hardest-won first (most help), then the one solved longest ago
        return ((fb?.fails ?? 0) + (fb?.hintLevel ?? 0)) - ((fa?.fails ?? 0) + (fa?.hintLevel ?? 0)) || (fa?.at ?? 0) - (fb?.at ?? 0) || a.slug.localeCompare(b.slug);
      });
    const isRepeat = fresh.length === 0;
    const ranked = isRepeat ? repeats : fresh;
    if (ranked.length === 0) continue;
    const problem = ranked[0];
    const e = expected(problem);
    const lastParts = helpParts(st.last);
    const why = [
      `Time for a quick ${name.get(st.concept)} review: you last solved one ${agoText(st.daysSinceLast)}, and a topic fades if you leave it alone.`,
      lastParts.length ? `That solve needed ${lastParts.join(" and ")}.` : "",
      isRepeat
        ? `You have already solved every ${name.get(st.concept)} problem, so this is one you solved before (your rating will not change, but the pattern should come back).`
        : `This is a fresh ${name.get(st.concept)} problem picked to be doable (about ${Math.round(e * 100)}% chance), so you can rebuild the pattern.`,
    ].filter(Boolean).join(" ");
    return {
      done: false, problem, expectedSuccess: e, mode: "review", explored: false, propensity: 1, greedySlug: problem.slug, repeated: false,
      review: { concept: st.concept, stage: st.stage, reviewsDone: st.reviewsDone, intervalDays: st.intervalDays, daysSinceLast: Math.round(st.daysSinceLast * 10) / 10, overdueRatio: Math.round(st.overdueRatio * 100) / 100, repeat: isRepeat, dueConcepts: due.length },
      candidates: ranked.slice(0, 12).map((p, i) => ({ slug: p.slug, concept: p.concept, expectedSuccess: Math.round(expected(p) * 1000) / 1000, conceptRating: Math.round((ratings.get(p.concept) ?? START_RATING) * 10) / 10, greedyRank: i + 1 })),
      fitsCount: ranked.length, poolSize: ranked.length, openCount: ranked.length, exploreRate: 0,
      reason: why,
    };
  }
  return null;
}
