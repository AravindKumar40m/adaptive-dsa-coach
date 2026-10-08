import { Bulb, Check, Lock, Spark } from "../icons.jsx";

// The four hint levels, one at a time, plus the optional AI explanation.
const LEVELS = ["Nudge", "Pattern", "Pseudocode", "Walkthrough"];

export function HelpPane({ hints, onHint, disabled, showAi, aiHint, feedback, onExplain }) {
  const { revealed, next } = hints;
  return (
    <div className="help">
      <h2>Need a hand?</h2>
      <p className="muted" style={{ marginBottom: 16 }}>
        Hints open one level at a time, from a small nudge to a full walkthrough. Using them is fine: each level lowers only the <em>independence</em> part of your score for this problem, so try the lighter ones first.
      </p>

      <ol className="ladder">
        {LEVELS.map((label, i) => {
          const level = i + 1;
          const h = revealed.find((r) => r.level === level);
          const isNext = next === level;
          return (
            <li key={level} className={`step ${h ? "open" : "locked"}`}>
              <div className="step-head">
                <span className="step-num">{h ? <Check size={13} /> : level}</span>
                <span className="step-title">{h ? `Hint ${level} · ${h.label}` : `Level ${level} · ${label}`}</span>
                {!h && !isNext && <Lock size={14} style={{ marginLeft: "auto", color: "var(--text-faint)" }} />}
                {isNext && <button className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={onHint} disabled={disabled}><Bulb size={15} /> Reveal</button>}
              </div>
              {h && <div className="step-body">{h.text}</div>}
            </li>
          );
        })}
      </ol>
      {next === null && <p className="muted" style={{ marginTop: 10 }}>All four hints are open.</p>}

      {showAi && (
        <div className="card ai-box">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div><strong>Explain my result</strong><div className="muted" style={{ fontSize: 13 }}>An AI tutor reads your last result and points at the problem without writing the solution. Counts as help level 2.</div></div>
            <button className="btn btn-primary" onClick={onExplain} disabled={feedback?.busy}><Spark size={15} /> {feedback?.busy ? "Thinking..." : "Explain"}</button>
          </div>
          {feedback?.text && <div className="out">{feedback.text}</div>}
          {feedback?.error && <div className="form-error">{feedback.error}</div>}
        </div>
      )}
      {!showAi && aiHint && <p className="faint" style={{ marginTop: 18, fontSize: 13 }}>{aiHint}</p>}
    </div>
  );
}
