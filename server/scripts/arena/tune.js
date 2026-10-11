// Chooses a model's settings (hyper-parameters) by trying values on VALIDATION learners, one setting at a time, twice around.
// Every model with settings gets the same treatment (including a tuned Elo), so the comparison is fair.
import { createModel, evaluate, logLoss } from "../../src/kt/index.js";

const ITEM = { itemLr: [2, 4, 8] };
const KALMAN = { sd0: [50, 75, 100, 150, 250, 350], drift: [0, 6, 12, 24], ...ITEM }; // ranges are wide on purpose: a chosen value at an edge means the range was too narrow
export const TUNING = {
  "elo-tuned": { kEarly: [20, 30, 40, 60], kLate: [8, 12, 16, 24], ...ITEM },
  "kt-unc": KALMAN,
  "kt-multi": KALMAN,
  "kt-forget": { ...KALMAN, halfLifeDays: [3, 7, 14, 30, 60, 120, Infinity] },
  logreg: { lr: [0.003, 0.01, 0.03], l2: [1e-4, 1e-3, 1e-2], epochs: [3, 6, 10] },
  "kt-full": { ...KALMAN, halfLifeDays: [3, 7, 14, 30, 60, 120, Infinity], transfer: [0, 0.25, 0.5, 0.75, 1], gain: [0, 3, 6, 10, 15, 20] },
};

export function tune(kind, catalog, train, valid, sweeps = 2) {
  const grid = TUNING[kind] ?? {};
  const score = (params) => { const m = createModel(kind, params, catalog); m.fit(train); return logLoss(evaluate(m, valid)); };
  let params = {}, best = score(params), tried = 1;
  for (let sweep = 0; sweep < sweeps; sweep++) {
    for (const [key, values] of Object.entries(grid)) {
      for (const value of values) {
        const candidate = { ...params, [key]: value };
        const s = score(candidate); tried++;
        if (s < best - 1e-9) { best = s; params = candidate; }
      }
    }
  }
  return { params, validLogLoss: best, tried };
}

export const showParams = (params) => Object.entries(params).map(([k, v]) => `${k}=${v === Infinity ? "∞" : v}`).join(" ") || "defaults";
