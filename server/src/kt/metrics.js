// How good are predictions? Rows are { learner, i (position in that learner's history), y (0/1), p }.
import { clampP } from "./math.js";

export const logLoss = (rows) => rows.reduce((s, r) => { const p = clampP(r.p); return s - (r.y ? Math.log(p) : Math.log(1 - p)); }, 0) / rows.length;
export const brier = (rows) => rows.reduce((s, r) => s + (r.p - r.y) ** 2, 0) / rows.length;
export const accuracy = (rows) => rows.filter((r) => (r.p >= 0.5) === (r.y === 1)).length / rows.length;

/** Area under the ROC curve: the chance a random solved attempt is ranked above a random unsolved one (ties count half). */
export function auc(rows) {
  const idx = rows.map((_, i) => i).sort((a, b) => rows[a].p - rows[b].p);
  const rank = new Array(rows.length);
  for (let i = 0; i < idx.length;) {
    let j = i;
    while (j + 1 < idx.length && rows[idx[j + 1]].p === rows[idx[i]].p) j++;
    for (let k = i; k <= j; k++) rank[idx[k]] = (i + j) / 2 + 1; // average rank for ties
    i = j + 1;
  }
  const pos = rows.filter((r) => r.y === 1).length, neg = rows.length - pos;
  if (pos === 0 || neg === 0) return NaN;
  const sumPos = rows.reduce((s, r, i) => s + (r.y === 1 ? rank[i] : 0), 0);
  return (sumPos - (pos * (pos + 1)) / 2) / (pos * neg);
}

/** Calibration: when we say "70%", does it happen about 70% of the time? Average gap over 10 equal bins, weighted by size. */
export function ece(rows, bins = 10) {
  const b = Array.from({ length: bins }, () => ({ n: 0, p: 0, y: 0 }));
  for (const r of rows) { const k = Math.min(bins - 1, Math.floor(r.p * bins)); b[k].n++; b[k].p += r.p; b[k].y += r.y; }
  return b.reduce((s, x) => s + (x.n ? (x.n / rows.length) * Math.abs(x.p / x.n - x.y / x.n) : 0), 0);
}

export function summarize(rows, coldCutoff = 8) {
  const cold = rows.filter((r) => r.i < coldCutoff), warm = rows.filter((r) => r.i >= coldCutoff);
  return {
    n: rows.length, logLoss: logLoss(rows), brier: brier(rows), auc: auc(rows), accuracy: accuracy(rows), ece: ece(rows),
    coldLogLoss: cold.length ? logLoss(cold) : NaN, warmLogLoss: warm.length ? logLoss(warm) : NaN,
  };
}

/**
 * Is model A really better than model B, or is it noise? The average log-loss difference over ALL attempts (B minus A: positive = A
 * is better), the same weighting as the log-loss column. Attempts of one learner are not independent, so the uncertainty is computed
 * per learner ("cluster-robust"): se = sqrt(sum over learners of (their summed deviation)^2) / number of attempts.
 * Rows of A and B must line up (same attempts, same order).
 */
export function pairedDifference(rowsA, rowsB) {
  const loss = (r) => { const p = clampP(r.p); return r.y ? -Math.log(p) : -Math.log(1 - p); };
  const d = rowsA.map((a, k) => loss(rowsB[k]) - loss(a));
  const n = d.length;
  const mean = d.reduce((s, x) => s + x, 0) / n;
  const perLearner = new Map();
  rowsA.forEach((a, k) => perLearner.set(a.learner, (perLearner.get(a.learner) ?? 0) + (d[k] - mean)));
  let ss = 0;
  for (const v of perLearner.values()) ss += v * v;
  return { mean, se: Math.sqrt(ss) / n, learners: perLearner.size };
}
