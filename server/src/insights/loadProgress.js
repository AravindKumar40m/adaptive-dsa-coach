// Database side of the progress report (the maths is in progress.js and gain.js).
import { CodeSnapshot } from "../models/CodeSnapshot.js";
import { ComplexityMeasurement } from "../models/ComplexityMeasurement.js";
import { HintEvent } from "../models/HintEvent.js";
import { ProblemEvent } from "../models/ProblemEvent.js";
import { RatingUpdate } from "../models/RatingUpdate.js";
import { Submission } from "../models/Submission.js";
import { loadSolveHistory } from "../skill/history.js";
import { loadLearnerState } from "../skill/learnerState.js";
import { buildProgress } from "./progress.js";

const ms = (d) => +new Date(d);

export async function loadProgress(learnerId, now = Date.now()) {
  const state = await loadLearnerState(learnerId);
  const [subs, updates, hints, events, snaps, solves, scaling] = await Promise.all([
    Submission.find({ learnerId }).select("problem mode verdict errorFamily createdAt -_id").lean(),
    RatingUpdate.find({ learnerId }).select("ratingBefore ratingAfter createdAt -_id").lean(),
    HintEvent.find({ learnerId }).select("createdAt -_id").lean(),
    ProblemEvent.find({ learnerId }).select("createdAt -_id").lean(),
    CodeSnapshot.find({ learnerId }).select("createdAt -_id").lean(),
    loadSolveHistory(learnerId, state.problems),
    ComplexityMeasurement.find({ learnerId }).select("problem verdict label expected createdAt -_id").lean(),
  ]);
  return buildProgress({
    ...state, solves, now,
    submissions: subs.map((s) => ({ problem: s.problem, mode: s.mode, verdict: s.verdict, errorFamily: s.errorFamily, at: ms(s.createdAt) })),
    updates: updates.map((u) => ({ at: ms(u.createdAt), before: u.ratingBefore, after: u.ratingAfter })),
    times: [...subs, ...hints, ...events, ...snaps].map((x) => ms(x.createdAt)),
    complexity: scaling.map((m) => ({ problem: m.problem, verdict: m.verdict, label: m.label, expected: m.expected, at: ms(m.createdAt) })),
  });
}
