// "Learning gain per unit of learner time": how much skill a learner gained for the time they actually worked.
// Pure functions: no database. The database side is loadProgress.js.
//
// ENGAGED TIME is estimated from timestamps we already record (every Run/Submit, hint, opened problem and code snapshot):
// the gap between two events in a row counts as work, but at most 5 minutes of it (a learner thinking for 10 minutes
// without touching anything gets 5); a gap of 30 minutes or more is a break and counts as nothing. It is a rough
// measure of time on task, not a stopwatch: long silent thinking is under-counted, a forgotten open tab is not counted.
//
// GAIN is the net change of the skill ratings (all topics added together) from the rating audit log. Early ratings move a
// lot while the coach is still learning about a learner (K = 40 for the first 10 attempts in a topic), and a gain can be
// negative, so read "points per hour" as a trend, not as a score. With under 20 minutes of work we do not divide at all.
export const GAP_CAP_MS = 5 * 60_000;
export const BREAK_MS = 30 * 60_000;
export const MIN_ENGAGED_MS = 20 * 60_000;

/** Engaged milliseconds from event times (ms). Only gaps whose LATER event falls inside [from, to] are counted. */
export function engagedMs(times, from = -Infinity, to = Infinity) {
  const t = [...times].sort((a, b) => a - b);
  let total = 0;
  for (let i = 1; i < t.length; i++) {
    if (t[i] < from || t[i] > to) continue;
    const gap = t[i] - t[i - 1];
    if (gap < BREAK_MS) total += Math.min(gap, GAP_CAP_MS);
  }
  return total;
}

const round1 = (x) => Math.round(x * 10) / 10;

/**
 * @param {{times:number[], updates:{at:number, before:number, after:number}[], solves:{at:number, problem:string}[], from?:number, to?:number}} a
 *   times: every event time; updates: rating changes; solves: accepted Submits (a problem counts once, at its first solve in the window)
 * @returns {{engagedMin:number, enough:boolean, points:number, pointsPerHour:number|null, solved:number, solvedPerHour:number|null, updates:number}}
 */
export function learningGain({ times, updates, solves, from = -Infinity, to = Infinity }) {
  const ms = engagedMs(times, from, to);
  const inWindow = (x) => x.at >= from && x.at <= to;
  const ups = updates.filter(inWindow);
  const points = ups.reduce((s, u) => s + (u.after - u.before), 0);
  const solvedProblems = new Set(solves.filter(inWindow).map((s) => s.problem));
  const hours = ms / 3_600_000;
  const enough = ms >= MIN_ENGAGED_MS;
  return {
    engagedMin: round1(ms / 60_000),
    enough,
    points: round1(points),
    pointsPerHour: enough ? round1(points / hours) : null,
    solved: solvedProblems.size,
    solvedPerHour: enough ? round1(solvedProblems.size / hours) : null,
    updates: ups.length,
  };
}
