// The "work pattern" summary the page sends with every Run/Submit: totals about HOW the learner worked in the editor
// since their last Run/Submit (never the keystrokes themselves, never anything outside the editor).
// The browser is not trusted: every number is checked and clamped here before it is stored.
const HOURS6 = 6 * 3600 * 1000;
const FIELDS = {
  windowMs: [0, HOURS6], openToFirstEditMs: [0, HOURS6], activeMs: [0, HOURS6], idleMs: [0, HOURS6],
  editCount: [0, 1e6], charsInserted: [0, 1e6], charsDeleted: [0, 1e6], charsPasted: [0, 1e6], pasteCount: [0, 1e4], maxPaste: [0, 1e6],
  languageSwitches: [0, 1e3], resets: [0, 1e3], tzOffsetMin: [-840, 840],
};

/** @returns {object|null} only the known fields, as clamped whole numbers */
export function sanitizeActivity(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out = {};
  for (const [key, [lo, hi]] of Object.entries(FIELDS)) {
    const v = raw[key];
    if (v === null || v === undefined) continue;
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    out[key] = Math.round(Math.min(hi, Math.max(lo, v)));
  }
  return Object.keys(out).length ? out : null;
}
