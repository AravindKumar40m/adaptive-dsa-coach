import { useEffect, useMemo, useState } from "react";
import { Close, StepBack, StepFirst, StepLast, StepNext, StepOutIcon, StepOverIcon } from "../components/icons.jsx";
import { explainEnd, explainStep, changesAt } from "./explain.js";
import { callList, callName, pointers, show, timelines } from "./model.js";
import { Value } from "./Values.jsx";

// "Step through my code": the panel under the editor. It only draws what the server recorded (see model.js); stepping makes no requests.

const PLACEHOLDER = { int: "5", bool: "true", string: '"abc"', "int[]": "[1, 2, 3]", "int[][]": "[[1, 2], [3, 4]]" };

// a number's history over one call, as a small line you can click to jump to that moment
function Sparkline({ series, step, onGoto }) {
  const W = 220, H = 40, P = 5;
  const vals = series.points.map((p) => p.value);
  const [lo, hi] = [Math.min(...vals), Math.max(...vals)];
  const x = (i) => P + (i / Math.max(1, series.points.length - 1)) * (W - 2 * P);
  const y = (v) => H - P - ((v - lo) / (hi - lo || 1)) * (H - 2 * P);
  const nowIdx = Math.max(0, series.points.findLastIndex((p) => p.step <= step));
  const click = (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    const f = (e.clientX - box.left) / box.width;
    onGoto(series.points[Math.round(Math.min(1, Math.max(0, f)) * (series.points.length - 1))].step);
  };
  return (
    <div className="spark">
      <div className="spark-head"><b className="mono">{series.name}</b><span className="faint num">{show(lo)} to {show(hi)}</span></div>
      <svg viewBox={`0 0 ${W} ${H}`} onClick={click} role="img" aria-label={`${series.name} over the run, from ${lo} to ${hi}. Click to jump.`}>
        <polyline points={series.points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ")} fill="none" stroke="var(--text-faint)" strokeWidth="1.5" />
        <circle cx={x(nowIdx)} cy={y(series.points[nowIdx].value)} r="4" fill="var(--accent)" />
      </svg>
    </div>
  );
}

function CustomInput({ params, first, busy, onRun, active }) {
  const [texts, setTexts] = useState(() => params.map((_, i) => (first?.[i] !== undefined ? JSON.stringify(first[i]) : "")));
  const [error, setError] = useState("");
  function go(e) {
    e.preventDefault();
    try { onRun(texts.map((t, i) => { if (!t.trim()) throw new Error(`Type a value for ${params[i].name}.`); return JSON.parse(t); })); setError(""); }
    catch (err) { setError(err instanceof SyntaxError ? "Write each value as JSON: numbers like 5, lists like [1, 2, 3], text in double quotes like \"abc\", true or false." : err.message); }
  }
  return (
    <form className="dbg-custom" onSubmit={go}>
      {params.map((p, i) => (
        <label key={p.name} className="dbg-field">
          <span className="mono">{p.name}</span>
          <input className="input mono" value={texts[i]} placeholder={PLACEHOLDER[p.type]} spellCheck={false} aria-label={`${p.name} (${p.type})`}
            onChange={(e) => setTexts((t) => t.map((x, k) => (k === i ? e.target.value : x)))} />
        </label>
      ))}
      <button className="btn" type="submit" disabled={busy}>{active ? "Trace again" : "Trace this input"}</button>
      {error && <div className="dbg-error" role="alert">{error}</div>}
    </form>
  );
}

export function Debugger({ session, actions, problem, hasFailing, examples, onPick, onExit }) {
  const { status, source, data, an, step, breaks } = session;
  const params = problem.signature.params;
  const [showCustom, setShowCustom] = useState(source.kind === "custom");

  // keyboard: arrows step, Shift + arrows step over, Home / End, N next change, C continue to the next breakpoint
  useEffect(() => {
    if (status !== "ready" || an.n === 0) return undefined;
    const on = (e) => {
      const typing = /^(INPUT|SELECT)$/.test(e.target.tagName) || (e.target.tagName === "TEXTAREA" && !e.target.readOnly);
      if (e.ctrlKey || e.metaKey || e.altKey || typing) return;
      const k = e.key;
      const act = k === "ArrowRight" ? (e.shiftKey ? actions.over : actions.next) : k === "ArrowLeft" ? (e.shiftKey ? actions.backOver : actions.back)
        : k === "Home" ? actions.first : k === "End" ? actions.last : k === "n" ? (e.shiftKey ? actions.prevChange : actions.nextChange) : k === "c" ? (e.shiftKey ? actions.contBack : actions.cont) : null;
      if (act) { e.preventDefault(); e.stopPropagation(); act(); }
    };
    window.addEventListener("keydown", on, true);
    return () => window.removeEventListener("keydown", on, true);
  }, [status, actions, an]);

  const end0 = status === "ready" && an.n === 0 ? explainEnd(data.trace, an, data.expected) : null; // a run that recorded no steps
  const view = useMemo(() => {
    if (status !== "ready" || an.n === 0) return null;
    const s = an.steps[step];
    const callId = an.callOfStep[step];
    const path = [];
    for (let c = an.calls[callId]; c; c = c.p >= 0 ? an.calls[c.p] : null) path.unshift(c);
    return {
      s, callId, path, story: explainStep(an, step, data.trace.result, data.expected), end: explainEnd(data.trace, an, data.expected),
      points: pointers(s.v), changes: new Map(changesAt(an, step).map((c) => [c.name, c])), series: timelines(an, callId), rows: callList(an),
      firstError: an.steps.findIndex((x) => x.e === "x"),
    };
  }, [status, an, step, data]);

  const chips = [
    ...Array.from({ length: examples }, (_, i) => ({ id: `e${i + 1}`, label: `Example ${i + 1}`, source: { kind: "example", index: i + 1 } })),
    ...(hasFailing ? [{ id: "failing", label: "Failing hidden test", source: { kind: "failing" } }] : []),
  ];
  const activeId = source.kind === "example" ? `e${source.index}` : source.kind === "failing" ? "failing" : "custom";

  return (
    <div className="dbg" aria-label="Step through your code">
      <div className="dbg-top">
      <div className="dbg-bar">
        <span className="eyebrow">Step through</span>
        <div className="cases" role="group" aria-label="Which input to run" style={{ margin: 0 }}>
          {chips.map((c) => (<button key={c.id} className="chip" aria-pressed={activeId === c.id && !showCustom} onClick={() => { setShowCustom(false); onPick(c.source); }}>{c.label}</button>))}
          <button className="chip" aria-pressed={showCustom} onClick={() => setShowCustom(true)}>Your input</button>
        </div>
        <div className="spacer" />
        <button className="btn btn-ghost" onClick={onExit} title="Back to editing your code"><Close size={14} /> Back to editing</button>
      </div>

      {showCustom && <CustomInput params={params} first={status === "ready" ? data.args : undefined} busy={status === "loading"} active={source.kind === "custom" && status === "ready"} onRun={(args) => onPick({ kind: "custom", args })} />}

      {status === "loading" && <div className="dbg-wait" role="status">Running your code once and recording every step...</div>}
      {status === "error" && <div className="callout bad" role="alert" style={{ margin: "10px 14px" }}>{session.error}</div>}

      {status === "ready" && !view && (
        <div className={`dbg-end ${end0.tone}`} role="status">
          <b>{data.label}:</b> {end0.head}{end0.body ? <span className="faint"> · {end0.body}</span> : null}
          <div className="dbg-nothing">Nothing ran line by line, so there is nothing to step through. Fix this and try again.</div>
        </div>
      )}

      {status === "ready" && view && (
        <>
          <div className={`dbg-end ${view.end.tone}`} role="status">
            <span className="dbg-end-text"><b>{data.label}:</b> {view.end.head}{view.end.body ? <span className="faint"> · {view.end.body}</span> : null}</span>
            <span className="dbg-end-jumps">
              {view.firstError >= 0 && <button className="linklike" onClick={() => actions.goto(view.firstError)}>Jump to the error</button>}
              <button className="linklike" onClick={actions.last}>Jump to the end</button>
            </span>
          </div>

          <div className="dbg-controls" role="toolbar" aria-label="Stepping">
            <button className="btn btn-icon" onClick={actions.first} disabled={step === 0} title="First step (Home)" aria-label="First step"><StepFirst /></button>
            <button className="btn btn-icon" onClick={actions.back} disabled={step === 0} title="Back one step (Left arrow)" aria-label="Back one step"><StepBack /></button>
            <button className="btn btn-icon btn-primary" onClick={actions.next} disabled={step >= an.n - 1} title="Forward one step (Right arrow)" aria-label="Forward one step"><StepNext /></button>
            <button className="btn btn-icon" onClick={actions.last} disabled={step >= an.n - 1} title="Last step (End)" aria-label="Last step"><StepLast /></button>
            <span className="dbg-sep" />
            <button className="btn" onClick={actions.over} disabled={step >= an.n - 1} title="Run past the calls this line makes (Shift + Right arrow)"><StepOverIcon size={15} /> Over</button>
            <button className="btn" onClick={actions.out} disabled={step >= an.n - 1} title="Finish this function call"><StepOutIcon size={15} /> Out</button>
            <button className="btn" onClick={actions.nextChange} disabled={step >= an.n - 1} title="Go to the next step where a variable changes (N)">Next change</button>
            {breaks.size > 0 && <button className="btn" onClick={actions.cont} disabled={step >= an.n - 1} title="Go to the next step on a line with a breakpoint (C)">To breakpoint</button>}
            <input className="dbg-slider" type="range" min={0} max={an.n - 1} value={step} onChange={(e) => actions.goto(Number(e.target.value))} aria-label="Position in the run" />
            <span className="dbg-stepcount num" aria-live="polite">Step {step + 1} of {an.n}{data.trace.truncated ? "+" : ""}</span>
          </div>

          <div className={`dbg-story ${view.story.tone}`} aria-live="polite">
            <b>{view.story.head}{view.story.body && !/[.!?]$/.test(view.story.head) ? "." : ""}</b>{view.story.body ? <span> {view.story.body}</span> : null}
          </div>
        </>
      )}
      </div>

      {status === "ready" && view && (
        <div className="dbg-scroll">
          <div className="dbg-body">
            <section className="dbg-col" aria-label="Variables">
              <div className="dbg-title">
                <span className="eyebrow">Variables</span>
                <span className="dbg-path">{view.path.map((c, i) => (<button key={c.id} className="linklike mono" onClick={() => actions.goto(Math.min(c.s, an.n - 1))} aria-current={i === view.path.length - 1 ? "true" : undefined}>{callName(c).slice(0, 40)}</button>))}</span>
              </div>
              {Object.keys(view.s.v).length === 0 && <p className="faint">No variables yet.</p>}
              {Object.entries(view.s.v).map(([name, value]) => {
                const ch = view.changes.get(name);
                const scalarWas = ch && !ch.isNew && ch.from !== undefined && (typeof ch.from !== "object") ? ch.from : undefined;
                return (
                  <div key={name} className={`var ${ch ? "changed" : ""}`}>
                    <div className="var-name mono">{name}{ch ? <span className="var-tag">{ch.isNew ? "new" : "changed"}</span> : null}{scalarWas !== undefined && <span className="var-was">was {show(scalarWas, 20)}</span>}</div>
                    <Value value={value} pointer={view.points[name]} vars={view.s.v} />
                  </div>
                );
              })}
              {view.series.length > 0 && (
                <div className="dbg-sub"><span className="eyebrow">How numbers moved in this call</span>{view.series.map((s) => (<Sparkline key={s.name} series={s} step={step} onGoto={actions.goto} />))}</div>
              )}
            </section>

            <section className="dbg-col" aria-label="The run">
              {an.wasted > 0 && (
                <div className="callout dbg-repeat">
                  <b>Repeated work.</b> The same call, with the same input, happened more than once: {an.wasted} extra {an.wasted === 1 ? "call" : "calls"} in all. The most repeated one: <span className="mono">{an.repeats[0].key}</span> ran {an.repeats[0].times} times.
                </div>
              )}
              {an.calls.length > 1 && (
                <>
                  <div className="dbg-title"><span className="eyebrow">Calls ({an.calls.length}{an.callsCapped ? "+" : ""})</span></div>
                  <ul className="calltree">
                    {view.rows.map(({ call, depth }) => (
                      <li key={call.id} style={{ paddingLeft: depth * 14 }}>
                        <button className={`call ${call.id === view.callId ? "now" : ""}`} onClick={() => actions.goto(Math.min(call.s, an.n - 1))} title="Jump to the start of this call">
                          <span className="mono">{callName(call).slice(0, 56)}</span>
                          <span className="call-ret mono">{call.x ? "error" : call.r === undefined ? "…" : `→ ${show(call.r, 24)}`}</span>
                          {an.repeatedOf(call) > 1 && <span className="call-rep" title="The same call, with the same input, happens more than once">×{an.repeatedOf(call)}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {an.callsCapped && <p className="faint" style={{ fontSize: 12 }}>Only the first 400 calls are listed.</p>}
                </>
              )}
              <div className="dbg-title"><span className="eyebrow">Printed so far</span></div>
              <pre className="codeblock mono">{data.trace.output.slice(0, view.s.o) || (data.trace.output ? "(nothing yet)" : "(your code prints nothing)")}</pre>
            </section>
          </div>
          <p className="dbg-keys faint">
            <kbd>←</kbd> <kbd>→</kbd> step · <kbd>Shift</kbd> + arrows step over · <kbd>Home</kbd> <kbd>End</kbd> · <kbd>N</kbd> next change · click a line number to set a breakpoint, <kbd>C</kbd> goes to it.
            The "x3" after a line of code shows how often that line ran.
          </p>
        </div>
      )}
    </div>
  );
}
