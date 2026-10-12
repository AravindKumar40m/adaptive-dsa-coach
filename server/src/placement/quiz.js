// The placement quiz engine (rules only, no model). Pure functions: no database, easy to test.
// The database side is routes/quiz.js and placement/apply.js; the questions live in content/placement/items.py.
//
// HOW IT ASKS (about 10 minutes, at most 24 questions):
//  1. Breadth: one MEDIUM (level 2) question per topic, in curriculum order.
//  2. If that is answered wrongly (or "I don't know"), the EASY (level 1) question of the same topic follows at once.
//  3. A topic where nothing was answered right is "weak": the topics that depend on it are not asked (they cannot be
//     practised before it anyway), so a beginner gets a very short quiz.
//  4. Refinement: with the questions left, a topic answered right at level 2 gets its HARD (level 3) question.
//
// HOW IT SCORES: the highest level answered right decides a starting rating for the topic (850 ... 1200). One question
// can be a lucky guess, so a single answer gives a weaker claim ("low" confidence) than two. These numbers are first
// guesses, they are only a starting point: real practice moves a rating by 40 points per attempt at first.
export const MAX_QUESTIONS = 24;
export const MIN_TO_FINISH = 6; // "stop and see my results" is offered after this many answers
export const MEDIUM = 2;
export const PLACED_RATING = 1120; // a topic at or above this counts as placed out: its dependants unlock without 2 solved problems

// how a topic's answers turn into a rating, a plain label and a confidence
export const RATINGS = {
  shaky: { rating: 850, label: "needs the basics" },
  shakyOneQuestion: { rating: 920, label: "probably needs the basics" },
  basics: { rating: 980, label: "knows the basics" },
  comfortableOneQuestion: { rating: 1080, label: "comfortable" },
  comfortable: { rating: 1120, label: "comfortable" },
  strong: { rating: 1200, label: "strong" },
};

/** answers: [{ concept, level, correct }] -> Map concept -> Map level -> correct */
function byTopic(answers) {
  const m = new Map();
  for (const a of answers) {
    if (!m.has(a.concept)) m.set(a.concept, new Map());
    m.get(a.concept).set(a.level, Boolean(a.correct));
  }
  return m;
}

/** A topic is weak when it was asked and nothing in it was answered right (and the easy question was tried). */
const isWeak = (levels) => levels && levels.size > 0 && ![...levels.values()].some(Boolean) && levels.has(1);

/**
 * The next question to ask, or null when the quiz is finished.
 * @param {{concepts:{key, prerequisites}[], items:{id, concept, level}[], answers:{concept, level, correct}[]}} a
 * @returns {{id:string, concept:string, level:number, phase:"breadth"|"easier"|"harder"} | null}
 */
export function nextQuestion({ concepts, items, answers }) {
  if (answers.length >= MAX_QUESTIONS) return null;
  const topics = byTopic(answers);
  const find = (concept, level) => items.find((i) => i.concept === concept && i.level === level);
  const blocked = (c) => c.prerequisites.some((p) => isWeak(topics.get(p)) || blocked(concepts.find((x) => x.key === p) ?? { prerequisites: [] }));

  // 1 + 2: breadth, with the easier question straight after a miss
  for (const c of concepts) {
    if (blocked(c)) continue;
    const levels = topics.get(c.key);
    if (!levels) { const q = find(c.key, MEDIUM); if (q) return { ...q, phase: "breadth" }; continue; }
    if (levels.get(MEDIUM) === false && !levels.has(1)) { const q = find(c.key, 1); if (q) return { ...q, phase: "easier" }; }
  }
  // 4: refinement, in curriculum order
  for (const c of concepts) {
    if (blocked(c)) continue;
    const levels = topics.get(c.key);
    if (levels?.get(MEDIUM) === true && !levels.has(3)) { const q = find(c.key, 3); if (q) return { ...q, phase: "harder" }; }
  }
  return null;
}

/** One topic's estimate from its answers, or null when nothing was asked. */
export function estimateTopic(levels) {
  if (!levels || levels.size === 0) return null;
  const asked = levels.size;
  const right = [...levels].filter(([, ok]) => ok).map(([l]) => l);
  const best = right.length ? Math.max(...right) : 0;
  let r;
  if (best === 0) r = asked >= 2 ? RATINGS.shaky : RATINGS.shakyOneQuestion;
  else if (best === 1) r = RATINGS.basics;
  else if (best === 2) r = levels.get(3) === false ? RATINGS.comfortable : RATINGS.comfortableOneQuestion;
  else r = RATINGS.strong;
  return { rating: r.rating, label: r.label, confidence: asked >= 2 ? "medium" : "low", asked, correct: right.length, bestLevel: best };
}

/**
 * The result of a quiz: an estimate for every topic that was asked, and which topics are placed out.
 * @returns {{topics:{concept, rating, label, confidence, asked, correct, bestLevel}[], placed:string[], answered:number, correct:number}}
 */
export function scoreQuiz({ concepts, answers }) {
  const topics = byTopic(answers);
  const out = [];
  for (const c of concepts) {
    const e = estimateTopic(topics.get(c.key));
    if (e) out.push({ concept: c.key, ...e });
  }
  return {
    topics: out,
    placed: out.filter((t) => t.rating >= PLACED_RATING).map((t) => t.concept),
    answered: answers.length,
    correct: answers.filter((a) => a.correct).length,
  };
}

// ---------------------------------------------------------------- shuffling (so the right answer is not always in the same place)
function hash32(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** A repeatable shuffle of [0..n-1]: the same quiz and question always show the same order (so a page reload does not reshuffle). */
export function shuffledOrder(n, seedText) {
  const rnd = mulberry32(hash32(seedText));
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return order;
}
