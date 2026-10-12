import { Router } from "express";
import mongoose from "mongoose";
import { PLACEMENT_VERSION } from "../core/versions.js";
import { makeLimiter } from "../core/rateLimit.js";
import { applyQuizRatings } from "../placement/apply.js";
import { MAX_QUESTIONS, MIN_TO_FINISH, nextQuestion, scoreQuiz, shuffledOrder } from "../placement/quiz.js";
import { Concept } from "../models/Concept.js";
import { PlacementItem } from "../models/PlacementItem.js";
import { PlacementQuiz } from "../models/PlacementQuiz.js";

// The placement quiz (rules in placement/quiz.js, questions in content/placement/items.py).
// The server decides which question comes next and checks every answer: the browser never receives the right answer
// or the explanation until the quiz is finished.
const router = Router();
const limiter = makeLimiter(240, 3600 * 1000); // answers per learner per hour: far above one quiz (24), stops floods
const MAX_MS = 10 * 60_000;

const loadBank = () => PlacementItem.find().lean();
const loadConcepts = () => Concept.find().sort({ order: 1 }).lean();
const rows = (doc) => doc.answers.map((a) => ({ concept: a.concept, level: a.level, correct: a.correct }));
const progress = (doc) => ({ answered: doc.answers.length, max: MAX_QUESTIONS, canStop: doc.answers.length >= MIN_TO_FINISH });

/** What the browser may see of a question: no answer, no explanation, options shuffled (the same way every time for this quiz). */
function present(item, doc, conceptNames) {
  const order = shuffledOrder(item.options.length, `${doc._id}:${item.id}`);
  return {
    id: item.id, number: doc.answers.length + 1, topic: conceptNames.get(item.concept) ?? item.concept, kind: item.kind,
    prompt: item.prompt, code: item.code ?? null, options: order.map((i) => ({ id: i, text: item.options[i] })),
  };
}

/** Everything about a finished quiz, including each question with the right answer and the explanation. */
function resultsPayload(doc, bank, conceptNames) {
  const byId = new Map(bank.map((i) => [i.id, i]));
  const name = (c) => conceptNames.get(c) ?? c;
  return {
    quizId: doc._id, finishedAt: doc.finishedAt, stoppedEarly: Boolean(doc.stoppedEarly),
    answered: doc.result?.answered ?? doc.answers.length, correct: doc.result?.correct ?? 0,
    topics: (doc.result?.topics ?? []).map((t) => ({ ...t, name: name(t.concept), applied: doc.applied.includes(t.concept) })),
    placed: (doc.result?.placed ?? []).map((c) => ({ concept: c, name: name(c) })),
    kept: doc.kept.map((c) => ({ concept: c, name: name(c) })),
    review: doc.answers.map((a) => {
      const item = byId.get(a.item);
      return {
        concept: a.concept, name: name(a.concept), level: a.level, kind: a.kind, prompt: item?.prompt, code: item?.code ?? null,
        yourAnswer: a.chosen >= 0 ? item?.options[a.chosen] ?? null : null, correctAnswer: item?.options[item.answer], right: a.correct, explain: item?.explain,
      };
    }),
  };
}

async function finish(doc, { stoppedEarly }) {
  const concepts = await loadConcepts();
  const scored = scoreQuiz({ concepts, answers: rows(doc) });
  const { applied, kept } = await applyQuizRatings({ learnerId: doc.learnerId, topics: scored.topics });
  doc.status = "finished"; doc.finishedAt = new Date(); doc.stoppedEarly = stoppedEarly;
  doc.result = scored; doc.applied = applied; doc.kept = kept; doc.algorithmVersion = PLACEMENT_VERSION;
  await doc.save();
  return resultsPayload(doc, await loadBank(), new Map(concepts.map((c) => [c.key, c.name])));
}

// Where the learner stands: a quiz in progress to resume, and the last finished result in short.
router.get("/quiz/status", async (req, res, next) => {
  try {
    const learnerId = req.user.learnerId;
    const [bankSize, inProgress, last] = await Promise.all([
      PlacementItem.countDocuments(),
      PlacementQuiz.findOne({ learnerId, status: "in_progress" }).sort({ createdAt: -1 }).lean(),
      PlacementQuiz.findOne({ learnerId, status: "finished" }).sort({ finishedAt: -1 }).lean(),
    ]);
    res.json({
      available: bankSize > 0,
      inProgress: inProgress && inProgress.answers.length > 0 ? { quizId: inProgress._id, answered: inProgress.answers.length } : null,
      last: last ? { quizId: last._id, finishedAt: last.finishedAt, answered: last.result?.answered, correct: last.result?.correct, placed: last.result?.placed?.length ?? 0, topics: last.result?.topics?.length ?? 0 } : null,
    });
  } catch (err) {
    next(err);
  }
});

// Start (or resume) the quiz.   body: { restart?: true } abandons a quiz in progress and begins again
router.post("/quiz/start", async (req, res, next) => {
  try {
    const learnerId = req.body.learnerId;
    const [bank, concepts] = await Promise.all([loadBank(), loadConcepts()]);
    if (bank.length === 0) return res.status(503).json({ error: "The placement quiz is not set up on this server yet." });
    const names = new Map(concepts.map((c) => [c.key, c.name]));
    let doc = await PlacementQuiz.findOne({ learnerId, status: "in_progress" }).sort({ createdAt: -1 });
    // only a quiz with answers can be abandoned by "start again"; an untouched one is simply reused
    if (doc && req.body.restart && doc.answers.length > 0) { doc.status = "abandoned"; await doc.save(); doc = null; }
    const resumed = Boolean(doc && doc.answers.length > 0);
    doc ??= await PlacementQuiz.create({ learnerId, bankVersion: bank[0].bankVersion, algorithmVersion: PLACEMENT_VERSION });
    const q = nextQuestion({ concepts, items: bank, answers: rows(doc) });
    if (!q) return res.status(409).json({ error: "This quiz has no more questions: finish it to see your results." });
    res.status(201).json({ quizId: doc._id, resumed, question: present(bank.find((i) => i.id === q.id), doc, names), progress: progress(doc) });
  } catch (err) {
    next(err);
  }
});

// Answer the current question.   body: { quizId, item, choice: 0..3 | -1 ("I don't know"), ms }
router.post("/quiz/answer", async (req, res, next) => {
  try {
    const { learnerId, quizId, item: itemId, choice, ms } = req.body ?? {};
    if (!mongoose.isValidObjectId(quizId)) return res.status(400).json({ error: "bad quiz id" });
    if (!Number.isInteger(choice) || choice < -1 || choice > 3) return res.status(400).json({ error: "choice must be 0 to 3, or -1 for 'I don't know'" });
    if (!limiter.take(learnerId).ok) return res.status(429).json({ error: "Too many answers. Slow down a little." });
    const doc = await PlacementQuiz.findOne({ _id: quizId, learnerId, status: "in_progress" });
    if (!doc) return res.status(404).json({ error: "That quiz is not in progress." });
    const [bank, concepts] = await Promise.all([loadBank(), loadConcepts()]);
    const names = new Map(concepts.map((c) => [c.key, c.name]));
    const current = nextQuestion({ concepts, items: bank, answers: rows(doc) });
    if (!current) return res.status(409).json({ error: "The quiz has no more questions: finish it." });
    if (current.id !== itemId) return res.status(409).json({ error: "That is not the current question.", question: present(bank.find((i) => i.id === current.id), doc, names), progress: progress(doc) });
    const item = bank.find((i) => i.id === current.id);
    const row = {
      item: item.id, concept: item.concept, level: item.level, kind: item.kind, chosen: choice, correct: choice === item.answer,
      ms: Number.isFinite(ms) ? Math.min(Math.max(Math.round(ms), 0), MAX_MS) : undefined,
      order: shuffledOrder(item.options.length, `${doc._id}:${item.id}`), at: new Date(),
    };
    // the size condition makes a double click safe: only one of two identical requests can add the answer
    const updated = await PlacementQuiz.findOneAndUpdate({ _id: doc._id, status: "in_progress", answers: { $size: doc.answers.length } }, { $push: { answers: row } }, { returnDocument: "after" });
    if (!updated) return res.status(409).json({ error: "That question was already answered." });
    const upcoming = nextQuestion({ concepts, items: bank, answers: rows(updated) });
    if (!upcoming) return res.json({ done: true, results: await finish(updated, { stoppedEarly: false }) });
    res.json({ done: false, question: present(bank.find((i) => i.id === upcoming.id), updated, names), progress: progress(updated) });
  } catch (err) {
    next(err);
  }
});

// "Stop and see my results" after at least MIN_TO_FINISH answers.   body: { quizId }
router.post("/quiz/finish", async (req, res, next) => {
  try {
    const { learnerId, quizId } = req.body ?? {};
    if (!mongoose.isValidObjectId(quizId)) return res.status(400).json({ error: "bad quiz id" });
    const doc = await PlacementQuiz.findOne({ _id: quizId, learnerId, status: "in_progress" });
    if (!doc) return res.status(404).json({ error: "That quiz is not in progress." });
    if (doc.answers.length < MIN_TO_FINISH) return res.status(400).json({ error: `Answer at least ${MIN_TO_FINISH} questions first, so the result means something.` });
    res.json({ done: true, results: await finish(doc, { stoppedEarly: true }) });
  } catch (err) {
    next(err);
  }
});

// The last finished result with every question, the right answer and the explanation.
router.get("/quiz/results", async (req, res, next) => {
  try {
    const learnerId = req.user.learnerId;
    const doc = await PlacementQuiz.findOne({ learnerId, status: "finished" }).sort({ finishedAt: -1 });
    if (!doc) return res.status(404).json({ error: "You have not finished the placement quiz yet." });
    const [bank, concepts] = await Promise.all([loadBank(), loadConcepts()]);
    res.json(resultsPayload(doc, bank, new Map(concepts.map((c) => [c.key, c.name]))));
  } catch (err) {
    next(err);
  }
});

export default router;
