// Replays learners through a model: predict each attempt BEFORE learning from it (so nothing leaks from the future).
import { createModel } from "./models.js";

/** @param {{learner:string, events:{slug:string,t:number,y:0|1}[]}[]} sequences  @returns rows { learner, i, y, p, slug, t } */
export function evaluate(model, sequences) {
  const rows = [];
  for (const seq of sequences) {
    const L = model.newLearner();
    seq.events.forEach((ev, i) => {
      const p = model.predict(L, ev);
      rows.push({ learner: seq.learner, i, y: ev.y, p, slug: ev.slug, t: ev.t });
      model.update(L, ev, ev.y);
    });
  }
  return rows;
}

/** Fit a fresh model on the training learners and score it on other learners. */
export function trainAndScore(kind, params, catalog, train, test) {
  const model = createModel(kind, params, catalog);
  model.fit(train);
  return { model, rows: evaluate(model, test) };
}
