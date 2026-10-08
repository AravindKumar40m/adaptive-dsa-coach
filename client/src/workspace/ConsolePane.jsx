import { useEffect, useState } from "react";
import { Arrow } from "../icons.jsx";
import { VERDICTS, describeActual, prettyConcept } from "../ui.jsx";

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

export function ConsolePane({ busy, mode, result, onNext, solved }) {
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
    </>
  );
  const details = (
    <>
      {result.verdict === "compile_error" && <pre className="codeblock bad mono" style={{ marginTop: 12, maxHeight: 220 }}>{result.compileOutput}</pre>}

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

      {result.mode === "submit" && hidden.length > 0 && (
        <div className="hidden-note">Hidden tests: {hidden.filter((t) => t.verdict === "passed").length} of {hidden.length} passed{hidden.some((t) => t.verdict !== "passed") ? ". Their inputs stay hidden, so use the examples to find the bug." : "."}</div>
      )}

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
      {accepted ? <>{outcome}{details}</> : <>{details}{outcome}</>}
    </div>
  );
}
