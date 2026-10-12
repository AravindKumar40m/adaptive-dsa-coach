// The complexity analyzer's maths: from "how long the learner's function took at each input size" to a verdict.
// Pure functions: no database, no Judge0, easy to test. The program that takes the timings is complexity/program.js;
// the HTTP side is routes/complexity.js.
//
// HOW IT DECIDES
//  * Time at each size n is the FASTEST of several repeats (noise only ever makes a run slower).
//  * Growth = the slope of  ln(time)  against  ln(n)  over the LARGEST sizes (small sizes are mostly call overhead):
//    about 0 = constant or log n, about 1 = n (n log n is about 1.1-1.2), about 2 = n squared, about 3 = n cubed.
//  * Exponential growth bends upwards on that log-log picture (the slope keeps rising), so it is detected separately.
//  * A solution that is already very fast (under 50 microseconds at the largest size measured) is "instant": growth cannot matter.
//  * The verdict compares the measured slope with the usual best solution's class: within 0.35 = matches, within 0.6 = near,
//    beyond = slow. It is ALWAYS a "likely": timing on a shared machine is noisy, and a verdict never marks a solution wrong.
export const CLASS_EXPONENT = { "log n": 0.1, n: 1, "n log n": 1.15, "n^2": 2, "n^3": 3 };
export const CLASS_LABEL = { "log n": "log n", n: "n", "n log n": "n log n", "n^2": "n²", "n^3": "n³", exp: "exponential" };
export const MATCH_TOLERANCE = 0.35;
export const NEAR_TOLERANCE = 0.6;
export const INSTANT_NS = 50_000; // under this at the largest size: too fast for growth to matter
export const RELIABLE_NS = 10_000; // a single point faster than this is mostly call overhead and noise: not used for the slope
export const TAIL_POINTS = 4; // how many of the largest sizes the slope is fitted on
export const MIN_R2 = 0.8; // below this the points do not lie on one line: "unclear"
export const EXPONENTIAL_SLOPE = 5; // a log-log slope this steep on a clean curve is exponential growth (no polynomial we teach goes beyond 3)

const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

/** Least-squares line through (x, y): { slope, r2 }. */
export function fitLine(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxx += (xs[i] - mx) ** 2; sxy += (xs[i] - mx) * (ys[i] - my); syy += (ys[i] - my) ** 2; }
  if (sxx === 0) return { slope: 0, r2: 0 };
  const slope = sxy / sxx;
  return { slope, r2: syy === 0 ? 1 : (sxy * sxy) / (sxx * syy) };
}

/** A plain name for a measured exponent. */
export function describeExponent(s) {
  if (s < 0.3) return "constant or log n";
  if (s < 0.75) return "between log n and n";
  if (s < 1.35) return "n (or n log n)";
  if (s < 1.7) return "between n log n and n²";
  if (s < 2.4) return "n²";
  if (s < 3.5) return "n³";
  return "worse than n³";
}

/**
 * @param {{points:{n:number, ns:number}[], expected:string, error?:{n:number, name:string}|null, killed?:boolean}} a
 *   points: the timings (fastest call at each size, in nanoseconds); expected: the usual best solution's class
 *   ("log n" | "n" | "n log n" | "n^2" | "n^3" | "exp"); error: the learner's code crashed at size n; killed: Judge0 stopped the run
 * @returns {{verdict:"matches"|"near"|"slow"|"unclear"|"unmeasured", label:string, exponent:number|null, r2:number|null,
 *            exponential:boolean, factor:number|null, measuredUpTo:number|null, expected:string, expectedLabel:string, message:string}}
 */
export function analyze({ points, expected, error = null, killed = false }) {
  const expectedLabel = CLASS_LABEL[expected] ?? expected;
  const base = { exponent: null, r2: null, exponential: false, factor: null, expected, expectedLabel };
  const pts = points.filter((p) => p.n > 0 && p.ns > 0).sort((a, b) => a.n - b.n);
  const measuredUpTo = pts.length ? pts.at(-1).n : null;
  const unmeasured = (message) => ({ ...base, verdict: "unmeasured", label: "not measured", measuredUpTo, message });

  if (pts.length === 0) {
    return unmeasured(error
      ? `Your code stopped with ${error.name} before anything could be measured, so we could not time it. (It passed the tests, so this only happens on the larger inputs we generate.)`
      : "Nothing could be measured.");
  }
  const maxNs = Math.max(...pts.map((p) => p.ns));
  const reliable = pts.filter((p) => p.ns >= RELIABLE_NS);

  // so fast that growth cannot matter (and nothing to fit)
  if (maxNs < INSTANT_NS) {
    return { ...base, verdict: "matches", label: "instant", measuredUpTo,
      message: `Even at n = ${measuredUpTo.toLocaleString("en-US")} one call took under 50 microseconds, so there is no sign of slow growth. Nice.` };
  }
  if (reliable.length < 3 || pts.length < 3) {
    const why = error ? `your code stopped with ${error.name} at n = ${error.n.toLocaleString("en-US")}` : killed ? "the run took too long and was stopped" : "too few sizes could be timed";
    return { ...unmeasured(`We could not tell how it grows: ${why}.`), verdict: "unclear", label: "unclear" };
  }

  const tail = reliable.slice(-TAIL_POINTS);
  const lx = tail.map((p) => Math.log(p.n)), ly = tail.map((p) => Math.log(p.ns));
  const { slope, r2 } = fitLine(lx, ly);

  // exponential: the log-log slope keeps rising along the tail (a power law has the same slope everywhere)
  let exponential = false, factor = null;
  if (tail.length >= 4) {
    const half = Math.floor(tail.length / 2);
    const early = fitLine(lx.slice(0, half + 1), ly.slice(0, half + 1)).slope;
    const late = fitLine(lx.slice(half), ly.slice(half)).slope;
    const semi = fitLine(tail.map((p) => p.n), ly);
    // either the slope keeps rising along the tail, or it is so steep that no polynomial we teach (up to n cubed) can explain it
    // (the rising-slope test alone is fragile: with sizes only 2 apart, ordinary noise can hide it)
    const rising = late >= 3 && late - early >= 1 && slope >= 2.5;
    const verySteep = slope >= EXPONENTIAL_SLOPE;
    if (semi.r2 >= 0.97 && (rising || verySteep)) { exponential = true; factor = Math.exp(semi.slope); } // semi.slope = ln(time multiplier) for each +1 in n
  }

  if (!exponential && r2 < MIN_R2) {
    return { ...base, verdict: "unclear", label: "unclear", r2: round(r2), exponent: round(slope), measuredUpTo,
      message: "The timings were too uneven to tell how it grows (the machine was probably busy). Try submitting again." };
  }

  let verdict;
  if (exponential) verdict = expected === "exp" ? "matches" : "slow";
  else {
    const e = CLASS_EXPONENT[expected] ?? 1;
    verdict = slope <= e + MATCH_TOLERANCE ? "matches" : slope <= e + NEAR_TOLERANCE ? "near" : "slow";
  }
  const label = exponential ? "exponential" : describeExponent(slope);
  const upTo = `at sizes up to n = ${measuredUpTo.toLocaleString("en-US")}`;
  const tenfold = exponential ? null : Math.round(10 ** Math.max(slope, 0));
  let message;
  if (exponential) {
    message = verdict === "matches"
      ? `Its running time grows exponentially ${upTo}, which is what is expected for this approach.`
      : `Your solution passed the tests, but its running time grows exponentially: each step up in n makes it about ${round(factor, 1)} times slower ${upTo}. A solution that grows like ${expectedLabel} exists, and it stays fast where this one stops being usable.`;
  } else if (verdict === "matches") {
    message = `Its running time grows like ${label} ${upTo}, as good as the usual best solution (${expectedLabel}).`;
  } else if (verdict === "near") {
    message = `Its running time grows like ${label} ${upTo}, a little slower than the usual best solution (${expectedLabel}). Fine for most inputs; very large ones would be slow.`;
  } else {
    message = `Your solution passed the tests, but its running time grows like ${label} ${upTo}, while a solution that grows like ${expectedLabel} exists. With 10 times more input, yours would take about ${tenfold.toLocaleString("en-US")} times longer.`;
  }
  return { ...base, verdict, label, exponent: round(slope), r2: round(r2), exponential, factor: factor == null ? null : round(factor, 2), measuredUpTo, message };
}
