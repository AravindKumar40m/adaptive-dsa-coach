// Knowledge models: each one predicts "will this learner solve this problem on their first Submit?" BEFORE seeing the
// result, then learns from the result. All share one interface so the arena can compare them fairly:
//   model.fit(sequences)            learn what can be learned offline (problem difficulty offsets, or a logistic fit)
//   L = model.newLearner()          fresh state for one learner
//   p = model.predict(L, event)     probability of success; must NOT change L
//   model.update(L, event, y)       learn from the outcome y (1 = solved on the first Submit, 0 = not)
// event = { slug, t (ms), ... }.  catalog = Map<slug, { slug, concept, skills: [{concept, weight}], seed }>.
import { DAY_MS, SCALE, START, sigmoid } from "./math.js";

export const DEFAULTS = {
  sd0: 250, //          starting uncertainty of a skill, in rating points (a brand-new skill: "somewhere 1000 +- 250")
  drift: 12, //         uncertainty added per attempt, so a skill can keep changing (people improve): rating points
  itemLr: 4, //         how fast a problem's difficulty moves when learners beat or miss the prediction (production uses 4)
  guess: 0, slip: 0, // chance of solving by luck / of failing a problem you know (0 = ignore)
  halfLifeDays: Infinity, // forgetting: a skill's rating halves its distance to 1000 every this many days unpractised
  transfer: 0, //       0..1: how much a NEW skill starts from the learner's overall level (strong at arrays -> likely decent at strings)
  gain: 0, //           rating points gained per attempt just from practising (on top of what the outcome says)
  kEarly: 40, kLate: 16, // Elo step sizes: for the first 10 attempts on a concept, then after (production values)
  lr: 0.01, l2: 1e-3, epochs: 5, // the trained logistic regression: step size, regularisation, passes over the training learners
};

class Base {
  constructor(params, catalog) {
    this.params = { ...DEFAULTS, ...params };
    this.catalog = catalog;
    this.offset = new Map(); // slug -> learned difficulty offset (rating points)
    this.difficultyProvider = null; // production shadow mode plugs the live difficulty in here
  }
  difficulty(item) { return this.difficultyProvider ? this.difficultyProvider(item) : item.seed + (this.offset.get(item.slug) ?? 0); }
  fit() {}
}

/** Learn each problem's difficulty offset by replaying the training learners (the same drift rule production uses). */
function fitItems(model, sequences, passes = 2) {
  for (let pass = 0; pass < passes; pass++) {
    for (const seq of sequences) {
      const L = model.newLearner();
      for (const ev of seq.events) {
        const p = model.predict(L, ev);
        model.offset.set(ev.slug, (model.offset.get(ev.slug) ?? 0) - model.params.itemLr * (ev.y - p));
        model.update(L, ev, ev.y);
      }
    }
  }
}

// ---------------------------------------------------------------- baselines that ignore the learner
class GlobalRate extends Base {
  name = "global-rate";
  rate = 0.5;
  newLearner() { return {}; }
  fit(sequences) { let n = 0, s = 0; for (const q of sequences) for (const e of q.events) { n++; s += e.y; } this.rate = n ? s / n : 0.5; }
  predict() { return this.rate; }
  update() {}
}

class ItemMean extends Base {
  name = "item-mean";
  counts = new Map();
  rate = 0.5;
  newLearner() { return {}; }
  fit(sequences) {
    let n = 0, s = 0;
    for (const q of sequences) for (const e of q.events) { n++; s += e.y; const c = this.counts.get(e.slug) ?? { n: 0, s: 0 }; c.n++; c.s += e.y; this.counts.set(e.slug, c); }
    this.rate = n ? s / n : 0.5;
  }
  predict(_L, ev) { const c = this.counts.get(ev.slug) ?? { n: 0, s: 0 }; return (c.s + 5 * this.rate) / (c.n + 5); } // shrunk towards the overall rate
  update() {}
}

// ---------------------------------------------------------------- the production rule (binary outcome)
class Elo extends Base {
  constructor(name, params, catalog) { super(params, catalog); this.name = name; }
  newLearner() { return { skills: new Map(), attempts: 0 }; }
  predict(L, ev) {
    const item = this.catalog.get(ev.slug);
    return sigmoid(((L.skills.get(item.concept)?.theta ?? START) - this.difficulty(item)) / SCALE);
  }
  update(L, ev, y) {
    const item = this.catalog.get(ev.slug);
    const p = this.predict(L, ev);
    const s = L.skills.get(item.concept) ?? { theta: START, n: 0 };
    s.theta += (s.n < 10 ? this.params.kEarly : this.params.kLate) * (y - p); // K = 40 for the first 10 attempts on a concept, then 16 (skill.js)
    s.n += 1;
    L.skills.set(item.concept, s);
    L.attempts += 1;
  }
  fit(sequences) { fitItems(this, sequences); }
}

// ---------------------------------------------------------------- Elo with uncertainty, and optional extras
// Each skill is "rating +- uncertainty" (theta, v = uncertainty squared). New or rarely practised skills move fast, well-measured ones
// slowly; predictions are pulled towards 50% while we are unsure (this makes them honest). This is the standard
// logistic Kalman / Glicko-style update. flags: multi = a problem trains all its skills (weights), forget = skills fade without
// practice, transfer = a new skill starts from the learner's overall level.
class Kalman extends Base {
  constructor(name, flags, params, catalog) { super(params, catalog); this.name = name; this.flags = flags; }
  // skills: concept -> { theta, v, n, last };  recent: the last 5 outcomes [{ y, concept }] (the recommender looks at streaks and variety)
  newLearner() { return { skills: new Map(), attempts: 0, recent: [] }; }
  skillsOf(item) { return this.flags.multi ? item.skills : [{ concept: item.concept, weight: 1 }]; }

  meanShift(L) { // the learner's overall level above or below the start, weighted by practice
    let sum = 0, n = 0;
    for (const s of L.skills.values()) { sum += (s.theta - START) * s.n; n += s.n; }
    return n ? sum / n : 0;
  }
  /** The skill as it is at time t (a copy): faded if forgetting is on, or a fresh start if never practised. */
  view(L, concept, t) {
    const P = this.params, v0 = P.sd0 ** 2;
    const stored = L.skills.get(concept);
    if (!stored) return { theta: START + (this.flags.transfer ? P.transfer * this.meanShift(L) : 0), v: v0, n: 0, last: t };
    const s = { ...stored };
    if (this.flags.forget && Number.isFinite(P.halfLifeDays) && s.last != null && t > s.last) { // last == null: only a starting guess, never practised
      const keep = 2 ** (-((t - s.last) / DAY_MS) / P.halfLifeDays); // 1 = nothing forgotten, 0.5 = one half-life
      s.theta = START + (s.theta - START) * keep;
      s.v = v0 - (v0 - s.v) * keep; // we also become less sure about it
    }
    return s;
  }
  latent(L, item, t) {
    const views = this.skillsOf(item).map(({ concept, weight }) => ({ concept, w: weight, s: this.view(L, concept, t) }));
    let theta = 0, v = 0;
    for (const { w, s } of views) { theta += w * s.theta; v += w * w * s.v; }
    return { views, theta, v, b: this.difficulty(item) };
  }
  predict(L, ev) {
    const { theta, v, b } = this.latent(L, this.catalog.get(ev.slug), ev.t);
    const kappa = 1 / Math.sqrt(1 + (Math.PI * v) / (8 * SCALE * SCALE)); // unsure -> closer to 50%
    const p = sigmoid((kappa * (theta - b)) / SCALE);
    return this.params.guess + (1 - this.params.guess - this.params.slip) * p;
  }
  update(L, ev, y) {
    const { views, theta, b } = this.latent(L, this.catalog.get(ev.slug), ev.t);
    const p = sigmoid((theta - b) / SCALE); // the plain Elo-style expectation at the current rating
    const P = this.params;
    for (const { concept, w, s } of views) {
      const vPrior = s.v + P.drift ** 2;
      const info = (w / SCALE) ** 2 * p * (1 - p); // how much this observation tells us (Fisher information)
      const vPost = 1 / (1 / vPrior + info);
      s.theta += vPost * (w / SCALE) * (y - p) + P.gain * w;
      s.v = vPost; s.n += 1; s.last = ev.t;
      L.skills.set(concept, s);
    }
    L.attempts += 1;
    L.recent = [...(L.recent ?? []), { y, concept: this.catalog.get(ev.slug).concept }].slice(-5);
  }

  /**
   * Everything the recommender wants to know about giving this learner this problem now, without changing anything:
   *   p        chance of solving it            info     how much of the starting uncertainty it would remove (0..1, per skill, weighted)
   *   review   rating points its skills have faded since last practice (weighted)
   *   weakness -1..1: how far its skills are below (+) or above (-) the learner's own average level, 150 points = full scale
   */
  describe(L, ev) {
    const item = this.catalog.get(ev.slug), P = this.params;
    const { views, theta, v, b } = this.latent(L, item, ev.t);
    const kappa = 1 / Math.sqrt(1 + (Math.PI * v) / (8 * SCALE * SCALE));
    const p = P.guess + (1 - P.guess - P.slip) * sigmoid((kappa * (theta - b)) / SCALE);
    const pPlug = sigmoid((theta - b) / SCALE);
    const v0 = P.sd0 ** 2, level = START + this.meanShift(L);
    let removed = 0, possible = 0, review = 0, weakness = 0;
    for (const { concept, w, s } of views) {
      const vPrior = s.v + P.drift ** 2;
      const vPost = 1 / (1 / vPrior + (w / SCALE) ** 2 * pPlug * (1 - pPlug));
      removed += w * (vPrior - vPost); possible += w * v0;
      const stored = L.skills.get(concept);
      if (stored) review += w * Math.max(0, stored.theta - s.theta);
      weakness += w * Math.max(-1, Math.min(1, (level - s.theta) / 150));
    }
    return { p, pPlug, info: removed / possible, review, weakness, level, skills: views.map(({ concept, w, s }) => ({ concept, w, theta: s.theta, v: s.v, n: s.n })) };
  }
  fit(sequences) { fitItems(this, sequences); }
}

// ---------------------------------------------------------------- a trained comparator: logistic regression on history features
// (the "data-hungry" kind of model: it learns its weights from the training learners). Features come only from the learner's past.
const N_FEATURES = 9;
class LogReg extends Base {
  name = "logreg";
  w = [0, 1, 0, 0, 0, 0, 0, 0, 0]; // starts as "just the problem's seed difficulty"
  bias = new Map(); // per-problem bias
  newLearner() { return { skills: new Map(), attempts: 0, succ: 0 }; } // skills: concept -> { s, f, last }
  features(L, ev) {
    const item = this.catalog.get(ev.slug);
    let fs = 0, ff = 0, fr = 0, fday = 0, ffirst = 0;
    for (const { concept, weight: w } of item.skills) {
      const s = L.skills.get(concept) ?? { s: 0, f: 0, last: null };
      fs += w * Math.log1p(s.s); ff += w * Math.log1p(s.f);
      fr += w * ((s.s + 1) / (s.s + s.f + 2) - 0.5);
      fday += w * (s.last == null ? 0 : Math.log1p((ev.t - s.last) / DAY_MS));
      ffirst += w * (s.s + s.f === 0 ? 1 : 0);
    }
    return [1, (START - item.seed) / SCALE, fs, ff, fr, Math.log1p(L.attempts), (L.succ + 1) / (L.attempts + 2) - 0.5, fday, ffirst];
  }
  score(x, slug) { let z = this.bias.get(slug) ?? 0; for (let i = 0; i < N_FEATURES; i++) z += this.w[i] * x[i]; return z; }
  predict(L, ev) { return sigmoid(this.score(this.features(L, ev), ev.slug)); }
  update(L, ev, y) {
    for (const { concept } of this.catalog.get(ev.slug).skills) {
      const s = L.skills.get(concept) ?? { s: 0, f: 0, last: null };
      s.s += y; s.f += 1 - y; s.last = ev.t;
      L.skills.set(concept, s);
    }
    L.attempts += 1; L.succ += y;
  }
  fit(sequences) {
    const { epochs, lr, l2 } = this.params;
    for (let ep = 0; ep < epochs; ep++) {
      const step = lr / (1 + ep);
      for (const seq of sequences) {
        const L = this.newLearner();
        for (const ev of seq.events) {
          const x = this.features(L, ev);
          const g = sigmoid(this.score(x, ev.slug)) - ev.y; // gradient of the log-loss
          for (let i = 0; i < N_FEATURES; i++) this.w[i] -= step * (g * x[i] + l2 * this.w[i]);
          this.bias.set(ev.slug, (this.bias.get(ev.slug) ?? 0) - step * (g + 10 * l2 * (this.bias.get(ev.slug) ?? 0)));
          this.update(L, ev, ev.y);
        }
      }
    }
  }
}

// ---------------------------------------------------------------- the list
export const KALMAN_FLAGS = {
  "kt-unc": { multi: false, forget: false, transfer: false }, //   Elo + uncertainty
  "kt-multi": { multi: true, forget: false, transfer: false }, //  + a problem trains all its skills
  "kt-forget": { multi: true, forget: true, transfer: false }, //  + skills fade without practice
  "kt-full": { multi: true, forget: true, transfer: true }, //     + a new skill starts from the learner's overall level (and practice gain)
};
export const MODEL_KINDS = ["global-rate", "item-mean", "elo", "elo-tuned", ...Object.keys(KALMAN_FLAGS), "logreg"];

export function createModel(kind, params, catalog) {
  if (kind === "global-rate") return new GlobalRate(params, catalog);
  if (kind === "item-mean") return new ItemMean(params, catalog);
  if (kind === "elo" || kind === "elo-tuned") return new Elo(kind, params, catalog); // "elo" = exactly production; "elo-tuned" = same rule with its step sizes tuned
  if (kind === "logreg") return new LogReg(params, catalog);
  if (KALMAN_FLAGS[kind]) return new Kalman(kind, KALMAN_FLAGS[kind], params, catalog);
  throw new Error(`unknown model: ${kind}`);
}

/** catalog from problem rows: { slug, concept, rating, skills? } */
export function buildCatalog(problems) {
  return new Map(problems.map((p) => [p.slug, {
    slug: p.slug, concept: p.concept, seed: p.rating,
    skills: p.skills?.length ? p.skills.map((s) => ({ concept: s.concept, weight: s.weight })) : [{ concept: p.concept, weight: 1 }],
  }]));
}
