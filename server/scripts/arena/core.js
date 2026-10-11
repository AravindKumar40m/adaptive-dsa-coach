// The reusable parts of the arena (the command line is in run.js, the tests import from here).
import { buildCatalog, createModel, evaluate, pairedDifference, summarize } from "../../src/kt/index.js";
import { showParams, tune } from "./tune.js";

export const KINDS = ["global-rate", "item-mean", "elo", "elo-tuned", "kt-unc", "kt-multi", "kt-forget", "kt-full", "logreg"];
export const MEANING = {
  "global-rate": "always the overall success rate",
  "item-mean": "each problem's own success rate, no learner info",
  elo: "production rule as it is today",
  "elo-tuned": "the same rule with its step sizes tuned",
  "kt-unc": "Elo + uncertainty",
  "kt-multi": "+ problems train all their skills",
  "kt-forget": "+ skills fade without practice",
  "kt-full": "+ new skills start from overall level, practice gain",
  logreg: "trained logistic regression on history features",
  oracle: "CEILING: knows each learner's true hidden skill (simulation only)",
};

/** 60% of learners train the model, 20% choose its settings, 20% are the exam. Split by LEARNER, never inside one learner's history. */
export function splitLearners(sequences) {
  const part = { train: [], valid: [], test: [] };
  sequences.forEach((s, i) => part[i % 10 < 6 ? "train" : i % 10 < 8 ? "valid" : "test"].push(s));
  return part;
}

/** Tune, fit and score every model on one dataset. @returns { [kind]: { params, rows, summary, vsElo }, sizes } */
export function runDataset({ sequences, catalogProblems }, kinds = KINDS) {
  const catalog = buildCatalog(catalogProblems);
  const split = splitLearners(sequences);
  const out = {};
  for (const kind of kinds) {
    const { params } = tune(kind, catalog, split.train, split.valid);
    const model = createModel(kind, params, catalog);
    model.fit(split.train);
    const rows = evaluate(model, split.test);
    out[kind] = { params, rows, summary: summarize(rows) };
  }
  if (split.test.every((s) => s.events.every((e) => e.pTrue != null))) { // simulated data: add the ceiling
    const rows = split.test.flatMap((s) => s.events.map((e, i) => ({ learner: s.learner, i, y: e.y, p: e.pTrue, slug: e.slug, t: e.t })));
    out.oracle = { params: {}, rows, summary: summarize(rows) };
  }
  if (out.elo) for (const kind of Object.keys(out)) out[kind].vsElo = pairedDifference(out[kind].rows, out.elo.rows);
  out.sizes = { train: split.train.length, valid: split.valid.length, test: split.test.length, testEvents: split.test.reduce((n, s) => n + s.events.length, 0) };
  return out;
}

const mean = (xs) => { const v = xs.filter((x) => Number.isFinite(x)); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : NaN; };

/** Average several runs (seeds) of the same world. */
export function aggregate(perSeed, kinds = KINDS) {
  const table = {};
  if (perSeed.every((r) => r.oracle)) kinds = [...kinds, "oracle"];
  for (const kind of kinds) {
    const sums = perSeed.map((r) => r[kind].summary);
    const diffs = perSeed.map((r) => r[kind].vsElo);
    table[kind] = {
      ...Object.fromEntries(["logLoss", "auc", "accuracy", "ece", "coldLogLoss", "warmLogLoss"].map((m) => [m, mean(sums.map((s) => s[m]))])),
      diff: mean(diffs.map((d) => d.mean)), diffSe: Math.sqrt(diffs.reduce((s, d) => s + d.se ** 2, 0)) / diffs.length,
      params: perSeed.map((r) => showParams(r[kind].params)),
    };
  }
  return table;
}

const f = (x, d = 4) => (Number.isFinite(x) ? x.toFixed(d) : "-");
export function markdownTable(table, kinds = KINDS) {
  if (table.oracle) kinds = [...kinds, "oracle"];
  const lines = ["| model | what it is | log-loss | AUC | accuracy | calibration gap | first 8 attempts | after 8 | better than Elo by (log-loss) | share of the Elo-to-ceiling gap closed |", "|---|---|---|---|---|---|---|---|---|---|"];
  const best = Math.min(...kinds.filter((k) => k !== "oracle").map((k) => table[k].logLoss));
  const gap = table.oracle ? table.elo.logLoss - table.oracle.logLoss : NaN;
  for (const k of kinds) {
    const t = table[k];
    const closed = k === "oracle" || !table.oracle ? "-" : `${f(((table.elo.logLoss - t.logLoss) / gap) * 100, 1)}%`;
    const verdict = k === "elo" ? "(reference)" : `${t.diff >= 0 ? "+" : ""}${f(t.diff)} ± ${f(t.diffSe)}${Math.abs(t.diff) > 2 * t.diffSe ? (t.diff > 0 ? " better" : " worse") : " ~same"}`;
    lines.push(`| ${t.logLoss === best ? "**" + k + "**" : k} | ${MEANING[k]} | ${f(t.logLoss)} | ${f(t.auc, 3)} | ${f(t.accuracy, 3)} | ${f(t.ece, 3)} | ${f(t.coldLogLoss)} | ${f(t.warmLogLoss)} | ${k === "oracle" ? "-" : verdict} | ${closed} |`);
  }
  return lines.join("\n");
}
