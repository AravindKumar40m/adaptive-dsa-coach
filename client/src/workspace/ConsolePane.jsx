import { useEffect, useState } from "react";
import { Arrow } from "../components/icons.jsx";
import { VERDICTS, describeActual, prettyConcept } from "../components/ui.jsx";
import { RateProblem } from "./Feedback.jsx";

const MIN = 700, MAX = 1500; // the ruler's range; ratings outside it are pinned to the ends
const pct = (r) => `${(100 * Math.min(MAX, Math.max(MIN, r) - MIN)) / (MAX - MIN)}%`;

// A measuring ruler with the rating before (hollow) and after (filled).
function Ruler({ before, after }) {
  const ticks = [];
  for (let v = MIN; v <= MAX; v += 100) ticks.push(v);
  return (
    <div className="ruler-wrap">
      <div className="ruler" role="img" aria-label={`Rating moved from ${Math.round(before)} to ${Math.round(after)}`}>
        <div className="track" />
        {ticks.map((v) => (<span key={v} className={`tick ${v % 200 === 0 ? "major" : ""}`} style={{ left: pct(v) }} />))}
        {ticks.filter((v) => v % 200 === 0).map((v) => (<span key={v} className="tick-label" style={{ left: pct(v) }}>{v}</span>))}
        <span className="span" style={{ left: pct(Math.min(before, after)), width: `calc(${pct(Math.max(before, after))} - ${pct(Math.min(before, after))})` }} />
        <span className="pin" style={{ left: pct(before) }} />
        <span className="pin now" style={{ left: pct(after) }} />
      </div>
    </div>
  );
}

function SkillCard({ skill }) {
  if (!skill.counted) return <div className="faint" style={{ marginTop: 12, fontSize: 13 }}>Skill: {skill.reason}</div>;
  const up = skill.delta >= 0;
  return (
    <div className="card skillcard">
      <div className="top">
        <div><span className="eyebrow">Skill · {prettyConcept(skill.concept)}</span>
          <div className="big num">{Math.round(skill.before)} → <b>{Math.round(skill.after)}</b> <span className={up ? "up" : "down"} style={{ fontSize: 15 }}>{up ? "+" : ""}{skill.delta.toFixed(1)}</span></div>
        </div>
        <div className="faint" style={{ fontSize: 12.5, textAlign: "right" }}>
          expected {Math.round(skill.expected * 100)}% · scored {Math.round(skill.score * 100)}%
          {skill.hintLevel > 0 && <div style={{ color: "var(--warn)" }}>help used: level {skill.hintLevel} of 4</div>}
        </div>
      </div>
      <Ruler before={skill.before} after={skill.after} />
    </div>
  );
}

function Case({ t }) {
  const [label] = VERDICTS[t.verdict] ?? [t.verdict];
  return (
    <div>
      <div className="faint" style={{ fontSize: 13 }}>{label}</div>
      <div className="kv"><b>Input</b><pre className="codeblock mono">{t.args.map((a) => JSON.stringify(a)).join(",  ")}</pre></div>
      <div className="kv"><b>Expected</b><pre className="codeblock mono">{JSON.stringify(t.expected)}</pre></div>
      <div className="kv"><b>Yours</b><pre className={`codeblock mono ${t.verdict === "passed" ? "" : "bad"}`}>{describeActual(t.actual)}</pre></div>
    </div>
  );
}

const SCALING_WORDS = { matches: ["As good as expected", "ok"], near: ["A little slower than expected", "warn"], slow: ["Slower than it could be", "bad"], unclear: ["Unclear", "neutral"], unmeasured: ["Not measured", "neutral"] };
const fmtTime = (ms) => (ms < 1 ? `${Math.round(ms * 1000)} µs` : ms < 1000 ? `${ms < 10 ? ms.toFixed(1) : Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`);

// time against input size, both on log scales: a straight line = polynomial growth, its steepness = the exponent
function ScalingChart({ points }) {
  const pts = points.filter((p) => p.ms > 0 && p.n > 0);
  if (pts.length < 3) return null;
  const W = 260, H = 96, P = 8;
  const lx = pts.map((p) => Math.log(p.n)), ly = pts.map((p) => Math.log(p.ms));
  const [x0, x1, y0, y1] = [Math.min(...lx), Math.max(...lx), Math.min(...ly), Math.max(...ly)];
  const sx = (v) => P + ((v - x0) / (x1 - x0 || 1)) * (W - 2 * P);
  const sy = (v) => H - P - ((v - y0) / (y1 - y0 || 1)) * (H - 2 * P);
  const line = pts.map((_, i) => `${sx(lx[i]).toFixed(1)},${sy(ly[i]).toFixed(1)}`).join(" ");
  return (
    <svg className="scaling-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Running time against input size, both on logarithmic scales">
      <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth="2" />
      {pts.map((_, i) => (<circle key={i} cx={sx(lx[i])} cy={sy(ly[i])} r="3" fill="var(--accent)" />))}
    </svg>
  );
}

// "How does my solution scale?": shown under a correct Python Submit (a few seconds after it). Always a "likely": timing is noisy.
function ScalingCard({ s }) {
  if (s.busy) return <div className="card scaling" aria-live="polite"><div className="eyebrow">How your solution scales</div><p className="muted" style={{ marginTop: 6 }}>Measuring... we run your solution on bigger and bigger inputs and time it (a few seconds).</p></div>;
  if (s.error) return <div className="faint" style={{ marginTop: 12, fontSize: 13 }}>Scaling check: {s.error}</div>;
  const d = s.data;
  const [words, tone] = SCALING_WORDS[d.verdict] ?? [d.verdict, "neutral"];
  return (
    <div className="card scaling" aria-live="polite">
      <div className="row" style={{ justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <span className="eyebrow">How your solution scales</span>
        <span className={`badge badge-${tone === "neutral" ? "accent" : tone}`}>{words}</span>
      </div>
      <p style={{ marginTop: 8 }}>{d.message}</p>
      <ScalingChart points={d.points} />
      {d.points.length >= 3 && <p className="faint" style={{ fontSize: 12, marginTop: 4 }}>Time (up) against input size (right), both on log scales: the steeper the line, the faster the time grows.</p>}
      {d.points.length > 0 && (
        <details className="scaling-table">
          <summary>The timings ({d.points.length} sizes)</summary>
          <table><thead><tr><th>Input size n</th><th>Time for one call</th></tr></thead>
            <tbody>{d.points.map((p) => (<tr key={p.n}><td className="num">{p.n.toLocaleString("en-US")}</td><td className="num">{fmtTime(p.ms)}</td></tr>))}</tbody></table>
        </details>
      )}
      <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>This is an estimate from timing your code on this machine, so treat it as "likely", not as a verdict. It never changes your rating and never marks a solution wrong.</p>
    </div>
  );
}

const HIDDEN_KIND = { edge: "an edge case", random: "a random case" };

// After a failed Submit: the ONE hidden test the server chose (the smallest failing input), shown like an example.
function HiddenFailure({ f }) {
  const timedOut = f.verdict === "time_limit";
  return (
    <div className="hidden-fail" role="group" aria-label="A hidden test your code fails">
      <div className="eyebrow">Hidden test {f.ordinal} of {f.of} · {HIDDEN_KIND[f.kind] ?? "a hidden case"} · the smallest one your code fails</div>
      {timedOut && <p className="muted" style={{ marginTop: 6 }}>Your code did not finish this input in time. It may loop forever on it, or be too slow.</p>}
      <div className="kv"><b>Input</b><pre className="codeblock mono">{f.args.map((a) => JSON.stringify(a)).join(",  ")}</pre></div>
      <div className="kv"><b>Expected</b><pre className="codeblock mono">{JSON.stringify(f.expected)}</pre></div>
      <div className="kv"><b>Yours</b><pre className="codeblock mono bad">{timedOut ? "(no answer in time)" : describeActual(f.actual)}</pre></div>
      <p className="faint" style={{ fontSize: 12.5, marginTop: 6 }}>Try this input by hand, or print inside your function while you Run it with a similar example. The other hidden tests stay hidden.</p>
    </div>
  );
}

export function ConsolePane({ busy, mode, result, onNext, solved, rate, nudge, onNudge, scaling }) {
  const [picked, setPicked] = useState(0);
  // jump to the first failing example when a new result arrives
  useEffect(() => {
    if (!result) return;
    const vis = result.tests.filter((t) => t.visible);
    const firstBad = vis.findIndex((t) => t.verdict !== "passed");
    setPicked(firstBad >= 0 ? firstBad : 0);
  }, [result]);

  if (busy) return <div className="console-body"><p className="console-empty">{mode === "submit" ? "Grading against every test..." : "Running your code on the examples..."}</p></div>;
  if (!result) {
    return (
      <div className="console-body">
        <div className="console-empty">
          <p><strong>Run</strong> tries your code on the visible examples. It never changes your rating.</p>
          <p><strong>Submit</strong> grades it on every test, including hidden ones, and updates your skill rating.</p>
          <p className="faint">Shortcuts: <kbd>Ctrl</kbd> + <kbd>Enter</kbd> runs, <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Enter</kbd> submits.</p>
        </div>
      </div>
    );
  }

  const [label, tone] = VERDICTS[result.verdict] ?? [result.verdict, "neutral"];
  const accepted = result.verdict === "accepted";
  const visible = result.tests.filter((t) => t.visible);
  const hidden = result.tests.filter((t) => !t.visible);
  const shown = visible[picked] ?? visible[0];

  // optional: how the problem felt (only after a Submit). Solved problems show it right under the Next button.
  const rateRow = result.mode === "submit" && rate ? <RateProblem state={rate.state} onFeel={rate.onFeel} onLiked={rate.onLiked} /> : null;

  // A solved Submit leads with what matters now (rating change, next problem); a failure leads with the cases.
  const outcome = (
    <>
      {result.skill && <SkillCard skill={result.skill} />}
      {solved && (
        <div className="next-row">
          <button className="btn btn-primary btn-lg" onClick={onNext}>Next problem <Arrow /></button>
          <span className="muted">Solved. We will pick one that fits your new rating.</span>
        </div>
      )}
      {accepted && rateRow}
      {accepted && result.mode === "submit" && scaling && <ScalingCard s={scaling} />}
    </>
  );
  // the hidden-test summary and, after a failed Submit, the ONE failing hidden test the server chose
  const hiddenSection = (
    <>
      {result.mode === "submit" && hidden.length > 0 && (
        <div className="hidden-note">Hidden tests: {hidden.filter((t) => t.verdict === "passed").length} of {hidden.length} passed{hidden.some((t) => t.verdict !== "passed") ? (result.hiddenFailure ? ". One hidden test your code fails is shown here." : ". Their inputs stay hidden, so use the examples to find the bug.") : "."}</div>
      )}
      {result.mode === "submit" && result.hiddenFailure && <HiddenFailure f={result.hiddenFailure} />}
    </>
  );
  // when every visible example passes, the hidden test is the only thing left to debug with: it comes FIRST, not below the passed examples
  const hiddenFirst = result.mode === "submit" && Boolean(result.hiddenFailure) && visible.every((t) => t.verdict === "passed");
  const details = (
    <>
      {result.verdict === "compile_error" && <pre className="codeblock bad mono" style={{ marginTop: 12, maxHeight: 220 }}>{result.compileOutput}</pre>}

      {hiddenFirst && hiddenSection}

      {visible.length > 0 && result.verdict !== "compile_error" && (
        <>
          <div className="cases" role="group" aria-label="Examples">
            {visible.map((t, i) => (
              <button key={i} className="chip" aria-pressed={picked === i} onClick={() => setPicked(i)}>
                <i className={t.verdict === "passed" ? "" : t.verdict === "not_run" ? "skip" : "fail"} /> Example {i + 1}
              </button>
            ))}
          </div>
          {shown && <Case t={shown} />}
        </>
      )}

      {!hiddenFirst && hiddenSection}

      {result.stdout && (<div className="kv"><b>Printed</b><pre className="codeblock mono">{result.stdout}</pre></div>)}
      {!accepted && result.verdict !== "compile_error" && result.stderr && (<div className="kv"><b>Error</b><pre className="codeblock bad mono">{result.stderr}</pre></div>)}
    </>
  );

  return (
    <div className="console-body">
      <div className={`verdict ${tone === "ok" ? "accepted" : tone}`}>
        <h3>{label}</h3>
        <span className="muted num">{result.passed} / {result.total} tests passed · {result.timeSec}s</span>
        <span className="badge" style={{ marginLeft: "auto" }}>{result.mode === "submit" ? "Submit" : "Run"}</span>
      </div>
      {nudge && !accepted && (
        <div className="callout nudge" role="status">
          <div>{nudge.text}</div>
          <div className="nudge-actions">
            <button className="btn btn-primary" onClick={() => onNudge(true)}>Open the hints</button>
            <button className="btn btn-ghost" onClick={() => onNudge(false)}>Not now</button>
          </div>
        </div>
      )}
      {accepted ? <>{outcome}{details}</> : <>{details}{outcome}</>}
      {!accepted && rateRow}
    </div>
  );
}
