// Database side of the struggle nudge (rule in struggle.js): after a Run/Submit that did not pass, decide whether to
// suggest a hint, and log the offer so a later study can ask "did the nudge help?".
import { helpLevel, LADDER } from "./hints.js";
import { ProblemEvent } from "./models/ProblemEvent.js";
import { Submission } from "./models/Submission.js";
import { STRUGGLE_RULE, evaluateStruggle } from "./struggle.js";

const FALLBACK_WINDOW_MS = 60 * 60_000; // when the browser sent no (believable) start time, look at the last hour

/** @returns {Promise<null | {level, label, text, rule}>} a nudge to show, or null */
export async function maybeNudge({ learnerId, problem, startedAt, secondsSpent, now = Date.now() }) {
  const since = secondsSpent != null && Number.isFinite(Date.parse(startedAt)) ? new Date(startedAt) : new Date(now - FALLBACK_WINDOW_MS);
  const [rows, level, shown] = await Promise.all([
    Submission.find({ learnerId, problem: problem.slug, createdAt: { $gte: since } }).sort({ createdAt: 1 }).select("mode verdict passed total createdAt -_id").lean(),
    helpLevel(learnerId, problem.slug),
    ProblemEvent.find({ learnerId, problem: problem.slug, kind: "nudge_shown" }).select("createdAt -_id").lean(),
  ]);
  const verdict = evaluateStruggle({
    attempts: rows.map((r) => ({ mode: r.mode, verdict: r.verdict, passed: r.passed ?? 0, total: r.total ?? 0, at: +r.createdAt })),
    secondsSpent, difficultyLabel: problem.difficulty, helpLevel: level, shownAt: shown.map((s) => +s.createdAt), now,
  });
  if (!verdict.offer) return null;

  const step = LADDER[verdict.nextLevel - 1];
  await ProblemEvent.create({ learnerId, problem: problem.slug, kind: "nudge_shown", value: { rule: STRUGGLE_RULE, level: step.level, ...verdict.signals } });
  return {
    rule: STRUGGLE_RULE, level: step.level, label: step.label,
    text: `Stuck for a while? A small hint might help: level ${step.level} (${step.label}). It lowers only the independence part of your score, and only a little.`,
  };
}
