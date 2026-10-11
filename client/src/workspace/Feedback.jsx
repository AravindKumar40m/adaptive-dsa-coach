import { useState } from "react";
import { ThumbDown, ThumbUp } from "../icons.jsx";

const FEEL = [["too_easy", "Too easy"], ["just_right", "Just right"], ["too_hard", "Too hard"]];
const SKIP = [["too_hard", "Too hard"], ["too_easy", "Too easy"], ["not_interested", "Not interested"], ["other", "Other"]];

/** After a Submit: how did the problem feel, and did you like it? (Optional; the latest answer counts.) */
export function RateProblem({ state, onFeel, onLiked }) {
  return (
    <div className="rate" role="group" aria-label="How was this problem?">
      <span className="muted">How was this problem?</span>
      <div className="seg">
        {FEEL.map(([k, label]) => (<button key={k} aria-pressed={state.feel === k} onClick={() => onFeel(k)}>{label}</button>))}
      </div>
      <div className="seg">
        <button aria-pressed={state.liked === true} onClick={() => onLiked(true)} aria-label="I liked it" title="I liked it"><ThumbUp size={15} /></button>
        <button aria-pressed={state.liked === false} onClick={() => onLiked(false)} aria-label="I did not like it" title="I did not like it"><ThumbDown size={15} /></button>
      </div>
    </div>
  );
}

/** Before a problem: how sure are you that you can solve it? (Optional; hidden once you have run code.) */
export function Confidence({ value, onPick }) {
  return (
    <div className="confidence" role="group" aria-label="How confident are you that you can solve this?">
      <span className="faint">How confident are you that you can solve this? <em>(optional)</em></span>
      <div className="seg">
        {[1, 2, 3, 4, 5].map((n) => (<button key={n} aria-pressed={value === n} onClick={() => onPick(n)} title={n === 1 ? "Not at all" : n === 5 ? "Very" : undefined}>{n}</button>))}
      </div>
      <span className="faint" style={{ fontSize: 12 }}>1 = not at all, 5 = very</span>
    </div>
  );
}

/** A skip button that asks why (one click). `onSkip(reason)` is called with the reason, or null if they would rather not say. */
export function SkipWithReason({ label, onSkip, disabled, className = "btn btn-ghost" }) {
  const [asking, setAsking] = useState(false);
  if (!asking) return <button className={className} onClick={() => setAsking(true)} disabled={disabled}>{label}</button>;
  return (
    <div className="skip-reasons" role="group" aria-label="Why skip?">
      <span className="muted">Why skip?</span>
      {SKIP.map(([k, text]) => (<button key={k} className="chip" onClick={() => { setAsking(false); onSkip(k); }}>{text}</button>))}
      <button className="btn btn-ghost" onClick={() => { setAsking(false); onSkip(null); }}>Just skip</button>
      <button className="btn btn-ghost" onClick={() => setAsking(false)} aria-label="Cancel">×</button>
    </div>
  );
}
