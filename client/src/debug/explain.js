// Plain-words sentences about what a step shows. Pure. Everything here describes what HAPPENED in the recorded run; it never says how to
// fix the code or names the technique to use (that is what the hint ladder is for).
import { POSITION_NAME, isSeq, show } from "./model.js";

const ordinal = (n) => (n === 1 ? "1 item" : `${n} items`);

/** what changed between the previous step of this call and this one: [{ name, from, to, isNew }] */
export function changesAt(an, i) {
  const s = an.steps[i];
  const prev = an.prevSame[i] >= 0 ? an.steps[an.prevSame[i]].v : null;
  return an.changed[i].map((name) => ({ name, from: prev && name in prev ? prev[name] : undefined, to: s.v[name], isNew: !prev || !(name in prev) }));
}

/** an explanation of why an error happened, from the variables at that moment (null when nothing useful can be said) */
export function explainError(x, vars) {
  const type = x.t, msg = x.m ?? "";
  const entries = Object.entries(vars);
  if (type === "IndexError") {
    const seqs = entries.filter(([, v]) => typeof v === "string" || isSeq(v));
    const ints = entries.filter(([, v]) => typeof v === "number" && Number.isInteger(v));
    // a variable named like a position (i, j, idx, mid ...) is the likelier culprit than a total that happens to be as large as the list
    ints.sort((a, b) => Number(POSITION_NAME.test(b[0])) - Number(POSITION_NAME.test(a[0])));
    for (const [iname, ival] of ints) for (const [sname, sv] of seqs) {
      const len = typeof sv === "string" ? sv.length : sv.n;
      if (ival >= len || ival < -len) {
        const valid = len === 0 ? `${sname} is empty, so it has no valid positions` : `the valid positions are 0 to ${len - 1}`;
        return `${iname} is ${ival}, but ${sname} has only ${ordinal(len)}: ${valid}.`;
      }
    }
    return "A position was used that is past the end of a list or string. Check the numbers the loop or the index can reach.";
  }
  if (type === "KeyError") return `The key ${msg} was looked up in a dictionary, but nothing was stored under it yet.`;
  if (type === "ZeroDivisionError") {
    const zeros = entries.filter(([, v]) => v === 0).map(([k]) => k);
    return `Something was divided by zero.${zeros.length ? ` Variables equal to 0 here: ${zeros.join(", ")}.` : ""}`;
  }
  if (type === "NameError" || type === "UnboundLocalError") {
    const m = /'([^']+)'/.exec(msg);
    return m ? `The name ${m[1]} is used here before anything was stored in it.` : null;
  }
  if (type === "RecursionError") return "The function kept calling itself and never stopped. Look at when it should stop calling itself.";
  if (type === "TypeError" && /NoneType/.test(msg)) return "A value that is None (nothing) was used as if it were a number, list or text.";
  return null;
}

/** one or two sentences for step i */
export function explainStep(an, i, result, expected) {
  const s = an.steps[i];
  if (s.e === "x") {
    const why = explainError(s.x, s.v);
    return { head: `Line ${s.l}: ${s.x.t}${s.x.m ? ` (${s.x.m})` : ""}`, body: why, tone: "bad" };
  }
  if (s.e === "u") return { head: `Leaving ${s.f} because of an error`, body: "The error was not handled here, so the function ends without returning a value.", tone: "bad" };
  if (s.e === "r") {
    const isTop = s.d === 1;
    const match = isTop && expected !== undefined && result?.k === "returned" ? JSON.stringify(plain(s.r)) === JSON.stringify(expected) : null;
    const tail = match === null ? "" : match ? ` That is what the test expects.` : ` The test expects ${show(expected)}.`;
    return { head: `${s.f} returns ${show(s.r)}`, body: tail.trim() || null, tone: match === false ? "bad" : match ? "ok" : "neutral" };
  }
  const ch = changesAt(an, i).filter((c) => !c.isNew || an.prevSame[i] >= 0);
  const first = an.prevSame[i] < 0;
  const head = first ? `${s.f} starts. Next line to run: ${s.l}` : `About to run line ${s.l}`;
  if (first) return { head, body: "These are the values it was called with.", tone: "neutral" };
  if (!ch.length) return { head, body: "Nothing changed since the previous line.", tone: "neutral" };
  const bits = ch.slice(0, 3).map((c) => (c.isNew ? `${c.name} was created: ${show(c.to, 30)}` : `${c.name} changed from ${show(c.from, 24)} to ${show(c.to, 24)}`));
  return { head, body: `The line before it ran, and ${bits.join("; ")}${ch.length > 3 ? `; and ${ch.length - 3} more` : ""}.`, tone: "neutral" };
}

function plain(v) {
  if (v && typeof v === "object" && (v.$ === "list" || v.$ === "tuple" || v.$ === "set")) return v.v.map(plain);
  return v && typeof v === "object" ? undefined : v;
}

/** what to tell the learner about how the whole run ended */
export function explainEnd(trace, an, expected) {
  const r = trace.result;
  if (r && r.k === "raised" && r.t === "SyntaxError") return { tone: "bad", head: `Your code has a syntax error${r.l ? ` on line ${r.l}` : ""}`, body: r.m || null };
  if (trace.truncated === "steps" || trace.truncated === "time" || trace.truncated === "size") {
    const top = Object.entries(an.lineCounts).sort((a, b) => b[1] - a[1]).slice(0, 2);
    const where = top.length ? ` The lines that ran most: ${top.map(([l, c]) => `line ${l} (${c.toLocaleString("en-US")} times)`).join(", ")}.` : "";
    return { tone: "bad", head: "Stopped early: this run is very long", body: `After ${an.n.toLocaleString("en-US")} steps we stop recording. If this is not meant to be a long run, the code may be looping forever.${where}` };
  }
  if (!r) return { tone: "neutral", head: "The run ended", body: null };
  if (r.k === "raised") return { tone: "bad", head: `The run ended with ${r.t}${r.l ? ` on line ${r.l}` : ""}`, body: r.m || null };
  if (r.k === "error") return { tone: "bad", head: r.t, body: r.m };
  if (expected === undefined) return { tone: "neutral", head: `Returned ${show(r.v)}`, body: "This is your own input, so there is no expected answer to compare with." };
  const ok = JSON.stringify(plain(r.v)) === JSON.stringify(expected);
  return ok
    ? { tone: "ok", head: `Returned ${show(r.v)}, as expected`, body: null }
    : { tone: "bad", head: `Returned ${show(r.v)}, but the test expects ${show(expected)}`, body: "Step back through the run and look for the first place where a value is not what you meant it to be." };
}
