// Counts HOW the learner works in the code editor, as totals (never the keystrokes, never anything outside the editor).
// Each Run or Submit takes the totals since the previous one and starts again from zero.
const ACTIVE_GAP_MS = 30_000; // pauses shorter than this count as working time, longer ones as idle time
const IDLE_CAP_MS = 15 * 60_000; // one long break counts as at most 15 minutes of idle time

export class ActivityTracker {
  constructor() { this.restart(); }

  /** A new problem was opened: forget everything. */
  restart(now = Date.now()) {
    this.openedAt = now;
    this.reported = false; // "time to first keystroke" is reported only once
    this.firstEditAt = null;
    this.lastEditAt = null;
    this.zero(now);
  }

  zero(now = Date.now()) {
    this.windowStart = now;
    this.c = { editCount: 0, charsInserted: 0, charsDeleted: 0, charsPasted: 0, pasteCount: 0, maxPaste: 0, activeMs: 0, idleMs: 0, languageSwitches: 0, resets: 0 };
  }

  /** The editor content changed by the learner. `changes` = Monaco's list of { text, rangeLength }. */
  edit(changes, now = Date.now()) {
    for (const ch of changes ?? []) {
      this.c.charsInserted += (ch.text ?? "").length;
      this.c.charsDeleted += ch.rangeLength ?? 0;
    }
    this.c.editCount += 1;
    if (this.firstEditAt === null) this.firstEditAt = now;
    if (this.lastEditAt !== null) {
      const gap = now - this.lastEditAt;
      if (gap <= ACTIVE_GAP_MS) this.c.activeMs += gap; else this.c.idleMs += Math.min(gap, IDLE_CAP_MS);
    }
    this.lastEditAt = now;
  }

  paste(chars) {
    this.c.charsPasted += chars;
    this.c.pasteCount += 1;
    this.c.maxPaste = Math.max(this.c.maxPaste, chars);
  }

  languageSwitch() { this.c.languageSwitches += 1; }
  reset() { this.c.resets += 1; }

  /** The totals since the last call, ready to send; then starts a new window. */
  take(now = Date.now()) {
    const c = { ...this.c };
    // a break that is still going on when the learner clicks Run counts too
    if (this.lastEditAt !== null) {
      const gap = now - this.lastEditAt;
      if (gap > ACTIVE_GAP_MS) c.idleMs += Math.min(gap, IDLE_CAP_MS);
    }
    const out = {
      ...c,
      windowMs: now - this.windowStart,
      tzOffsetMin: -new Date(now).getTimezoneOffset(),
    };
    if (!this.reported && this.firstEditAt !== null) { out.openToFirstEditMs = this.firstEditAt - this.openedAt; this.reported = true; }
    this.zero(now);
    return out;
  }
}
