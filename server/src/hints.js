// The hint ladder: 4 levels per problem, written by us and stored with the problem (free, instant, cached by nature).
// A learner must go one level at a time; each newly revealed level is logged and lowers the independence score.
import { HintEvent } from "./models/HintEvent.js";

export const LADDER = [
  { level: 1, key: "nudge", label: "Nudge" },
  { level: 2, key: "pattern", label: "Pattern" },
  { level: 3, key: "pseudocode", label: "Pseudocode" },
  { level: 4, key: "walkthrough", label: "Walkthrough" },
];
export const FEEDBACK_LEVEL = 2; // an AI explanation counts like a level-2 hint

/** Highest help level shown to this learner on this problem (0 = none). */
export async function helpLevel(learnerId, problem) {
  const top = await HintEvent.findOne({ learnerId, problem }).sort({ level: -1 }).select("level").lean();
  return top?.level ?? 0;
}

/** The ladder hints already revealed, in order, with their text. */
export async function revealedHints(learnerId, problem) {
  const events = await HintEvent.find({ learnerId, problem: problem.slug, kind: "ladder" }).select("level").lean();
  const top = Math.max(0, ...events.map((e) => e.level));
  const revealed = LADDER.filter((l) => l.level <= top).map((l) => ({ ...l, text: problem.hints[l.key] }));
  return { revealed, next: top >= LADDER.length ? null : top + 1 };
}

/** Reveal the next ladder level (never skips ahead). Returns the same shape as revealedHints plus `isNew`. */
export async function revealNext(learnerId, problem) {
  const before = await revealedHints(learnerId, problem);
  if (before.next === null) return { ...before, isNew: false };
  const step = LADDER[before.next - 1];
  await HintEvent.create({ learnerId, problem: problem.slug, kind: "ladder", level: step.level, source: "stored", text: problem.hints[step.key] });
  return { ...(await revealedHints(learnerId, problem)), isNew: true };
}
