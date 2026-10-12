// Everything about a recorded run that is not drawing: which variables changed, how to step over or out, where the pointers
// point, the call tree and the calls that were made twice. Pure functions on the trace the server sends (see server/src/debug/program.js):
//   steps[i] = { l: line, f: function, d: call depth, o: characters printed so far, v: local variables,
//                e?: "r" returned | "u" left because of an error | "x" an error was raised here, r?: returned value, x?: {t, m} }
//   calls[k] = { id, p: parent id, f, s: first step, t: last step, a: arguments, r?: returned value, x?: ended by an error }
// A "line" step is recorded BEFORE its line runs, so the change a line made shows up on the NEXT step of the same call.
// Values are tagged: scalars as they are, else { $: "list" | "tuple" | "set" | "dict" | "int" | "float" | "obj", v, n }.

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function analyze(trace) {
  const { steps, calls } = trace;
  const n = steps.length;

  // the previous step of the SAME call (not a callee's, not a sibling call's), and what changed since
  const prevSame = new Array(n).fill(-1);
  const changed = new Array(n);
  const lastAt = [];
  let before = null;
  for (let i = 0; i < n; i++) {
    const s = steps[i];
    if (before && before.d < s.d) lastAt[s.d] = undefined; // a call just started: nothing before it belongs to it
    lastAt.length = Math.min(lastAt.length, s.d + 1); // callees that already finished are forgotten
    prevSame[i] = lastAt[s.d] ?? -1;
    const p = prevSame[i] >= 0 ? steps[prevSame[i]].v : null;
    changed[i] = p ? Object.keys(s.v).filter((k) => !(k in p) || !same(p[k], s.v[k])) : [];
    lastAt[s.d] = i;
    if (s.e === "r" || s.e === "u") lastAt[s.d] = undefined; // the call ended
    before = s;
  }

  // which call each step belongs to (later calls are nested inside earlier ones, so they overwrite)
  const callOfStep = new Array(n).fill(-1);
  for (const c of calls) for (let i = c.s; i <= (c.t ?? n - 1) && i < n; i++) callOfStep[i] = c.id;

  // how often each line ran
  const lineCounts = {};
  for (const s of steps) if (!s.e) lineCounts[s.l] = (lineCounts[s.l] ?? 0) + 1;

  // the same call made more than once with the same input, in a function that calls itself
  const keyOf = (c) => `${c.f}(${JSON.stringify(c.a)})`;
  const counts = new Map();
  for (const c of calls) counts.set(keyOf(c), (counts.get(keyOf(c)) ?? 0) + 1);
  const recursive = new Set(calls.filter((c) => c.p >= 0 && calls[c.p]?.f === c.f).map((c) => c.f));
  const repeatedOf = (c) => (recursive.has(c.f) ? counts.get(keyOf(c)) : 1);
  const repeats = [...counts.entries()].filter(([k, v]) => v >= 2 && recursive.has(k.slice(0, k.indexOf("(")))).sort((a, b) => b[1] - a[1]).map(([key, times]) => ({ key, times }));
  const wasted = repeats.reduce((sum, r) => sum + r.times - 1, 0);

  return { steps, calls, n, prevSame, changed, callOfStep, lineCounts, repeatedOf, repeats, wasted, callsCapped: calls.length >= 400 };
}

/** step over: the next step that is not inside a call made from here */
export const stepOver = (an, i) => { for (let j = i + 1; j < an.n; j++) if (an.steps[j].d <= an.steps[i].d) return j; return an.n - 1; };
/** step out: the next step after this function has finished */
export const stepOut = (an, i) => { for (let j = i + 1; j < an.n; j++) if (an.steps[j].d < an.steps[i].d) return j; return an.n - 1; };
export const backOver = (an, i) => { for (let j = i - 1; j >= 0; j--) if (an.steps[j].d <= an.steps[i].d) return j; return 0; };
/** the next step where any variable of the call is different from the step before it */
export const nextChange = (an, i) => { for (let j = i + 1; j < an.n; j++) if (an.changed[j].length) return j; return an.n - 1; };
export const prevChange = (an, i) => { for (let j = i - 1; j >= 0; j--) if (an.changed[j].length) return j; return 0; };
/** the next step on a line that has a breakpoint (or the end of the run) */
export function nextBreak(an, i, lines) {
  for (let j = i + 1; j < an.n; j++) if (lines.has(an.steps[j].l) && !an.steps[j].e) return j;
  return an.n - 1;
}
export function prevBreak(an, i, lines) {
  for (let j = i - 1; j >= 0; j--) if (lines.has(an.steps[j].l) && !an.steps[j].e) return j;
  return 0;
}

// ---------------------------------------------------------------- values

export const kindOf = (v) => (v && typeof v === "object" ? v.$ : v === null ? "none" : typeof v === "boolean" ? "bool" : typeof v === "number" ? (Number.isInteger(v) ? "int" : "float") : "str");
export const isSeq = (v) => v && typeof v === "object" && (v.$ === "list" || v.$ === "tuple");
export const isGrid = (v) => isSeq(v) && v.v.length > 0 && v.v.every((r) => isSeq(r));

/** the value as short text, the way Python would show it */
export function show(v, max = 60) {
  const text = (x) => {
    if (x === null) return "None";
    if (typeof x === "boolean") return x ? "True" : "False";
    if (typeof x === "number") return String(x);
    if (typeof x === "string") return JSON.stringify(x);
    if (x.$ === "list" || x.$ === "tuple" || x.$ === "set") {
      const inner = x.v.map(text).join(", ") + (x.n > x.v.length ? `, … (${x.n} in all)` : "");
      return x.$ === "list" ? `[${inner}]` : x.$ === "tuple" ? `(${inner}${x.v.length === 1 ? "," : ""})` : x.n === 0 ? "set()" : `{${inner}}`;
    }
    if (x.$ === "dict") return `{${x.v.map(([k, val]) => `${text(k)}: ${text(val)}`).join(", ")}${x.n > x.v.length ? `, … (${x.n} in all)` : ""}}`;
    return String(x.v);
  };
  const t = text(v);
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

// ---------------------------------------------------------------- pointers

// names learners usually give to positions in a list or string
export const POSITION_NAME = /^(i|j|k|l|r|p|q|m|lo|hi|low|high|left|right|mid|start|end|idx|index|pos|ptr|slow|fast|head|tail|cur_?i|best_?i|[ijklrpq]\d)$|(_i|_j|_idx|_index|_pos|_ptr|_left|_right|_lo|_hi|_start|_end)$/;
const ROW_NAME = /^(i|r|row|y)$/, COL_NAME = /^(j|c|col|x)$/;

/**
 * Where the position variables point. For each list or string variable: { cells: {index: [names]}, end: [names] } where `end` means "one past
 * the last element". Only whole-number variables with a position-like name and a value from 0 to len are used. A guess from names, shown as markers.
 */
export function pointers(vars) {
  const ints = Object.entries(vars).filter(([name, v]) => Number.isInteger(v) && typeof v === "number" && POSITION_NAME.test(name));
  const out = {};
  for (const [name, v] of Object.entries(vars)) {
    const len = typeof v === "string" ? v.length : isSeq(v) ? v.n : null;
    if (len === null || len === 0) continue;
    const cells = {}, end = [];
    for (const [iname, ival] of ints) {
      if (iname === name) continue;
      if (ival >= 0 && ival < Math.min(len, isSeq(v) ? v.v.length : len)) (cells[ival] ??= []).push(iname);
      else if (ival === len) end.push(iname);
    }
    if (Object.keys(cells).length || end.length) out[name] = { cells, end };
  }
  return out;
}

/** the cell a 2-D grid variable is "at", if there are row and column variables */
export function gridCursor(vars, grid) {
  const num = (re) => Object.entries(vars).find(([k, v]) => re.test(k) && Number.isInteger(v) && typeof v === "number");
  const r = num(ROW_NAME), c = num(COL_NAME);
  if (!r || !c || r[1] < 0 || c[1] < 0 || r[1] >= grid.v.length || !isSeq(grid.v[r[1]]) || c[1] >= grid.v[r[1]].v.length) return null;
  return { row: r[1], col: c[1] };
}

// ---------------------------------------------------------------- timelines

/** the numbers a variable took over the steps of ONE call: [{ step, value }], only variables that really change */
export function timelines(an, callId, max = 4) {
  const series = {};
  for (let i = 0; i < an.n; i++) {
    if (an.callOfStep[i] !== callId) continue;
    for (const [name, v] of Object.entries(an.steps[i].v)) if (typeof v === "number" && Number.isFinite(v)) (series[name] ??= []).push({ step: i, value: v });
  }
  return Object.entries(series)
    .map(([name, points]) => ({ name, points, distinct: new Set(points.map((p) => p.value)).size }))
    .filter((s) => s.distinct >= 3 && s.points.length >= 4)
    .sort((a, b) => b.distinct - a.distinct)
    .slice(0, max);
}

// ---------------------------------------------------------------- the call tree

/** calls as an indented list (depth-first), with how many calls each one made */
export function callList(an) {
  const kids = new Map();
  for (const c of an.calls) (kids.get(c.p) ?? kids.set(c.p, []).get(c.p)).push(c);
  const out = [];
  const walk = (c, depth) => { out.push({ call: c, depth, children: kids.get(c.id)?.length ?? 0 }); for (const k of kids.get(c.id) ?? []) walk(k, depth + 1); };
  for (const c of kids.get(-1) ?? []) walk(c, 0);
  return out;
}

/** the call's name with its arguments: f(n=3, memo={…}) */
export function callName(c) {
  const args = Object.entries(c.a ?? {}).map(([k, v]) => `${k}=${show(v, 24)}`).join(", ");
  return `${c.f}(${args})`;
}
