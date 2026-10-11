// Version tags written onto log rows, so a later analysis always knows WHICH rules produced a decision or a score.
// Change the tag whenever the behaviour of that part changes (new constants, new formula, new picker rules).
export const PICKER_VERSION = "picker-2"; // 2 = candidate log, sticky picks, optional variety picks
export const SCORING_VERSION = "score-1"; // the Elo + correctness/independence/efficiency formula in skill.js
export const RECOMMENDER2_VERSION = "rec-2.0"; // recommender v2 (recommender2.js): fit + information + weakness + review + variety, session arc
export const KT_VERSION = "kt-full-0.1"; // the new knowledge model running in shadow mode (kt/shadow.js)
export const LOGGING_VERSION = "log-2"; // which signals are captured (see docs/data-dictionary.md)
