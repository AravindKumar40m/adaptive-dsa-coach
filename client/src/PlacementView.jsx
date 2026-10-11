import { useState } from "react";
import { api } from "./api.js";
import { go } from "./hooks.js";

const LEVELS = [
  [0, "Never heard of it"],
  [1, "Heard of it"],
  [2, "I know the basics"],
  [3, "Comfortable with it"],
  [4, "I could teach it"],
];
const EXPERIENCE = [
  [0, "Brand new to this"],
  [1, "Some experience"],
  [2, "A fair amount"],
  [3, "A lot"],
];

/** An optional one-minute self-assessment. It only sets a weak starting guess; real results always win. */
export function PlacementView({ skills, existing, onSaved }) {
  const topics = (skills?.skills ?? []).filter((s) => s.total > 0);
  const [answers, setAnswers] = useState(() => ({ ...(existing?.answers ?? {}) }));
  const [experience, setExperience] = useState(existing?.experience ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const answered = Object.keys(answers).length;

  async function save(e) {
    e.preventDefault();
    setError("");
    if (answered === 0) { setError("Answer at least one topic, or go back and skip this."); return; }
    setBusy(true);
    const body = { answers, ...(experience === "" ? {} : { experience: Number(experience) }) };
    const r = await api("/placement", { method: "POST", body });
    setBusy(false);
    if (!r.ok) { setError(r.data.error ?? "Could not save that."); return; }
    onSaved({ done: true, answers, experience: experience === "" ? null : Number(experience) });
    go("#/");
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 760 }}>
        <h1 className="page-title">Where are you now?</h1>
        <p className="page-sub">An optional one-minute check. For each topic, how well do you think you know it? We use your answers only as a rough starting guess, so the first problems fit you a little better. <strong>Real results always win</strong>: after you solve a few problems, your answers stop mattering. You can skip topics you are unsure about.</p>

        <form onSubmit={save} className="card" style={{ marginTop: 18, padding: 18 }}>
          <label className="field" style={{ marginBottom: 16 }}>
            <span>Overall, how much programming practice have you had?</span>
            <select className="select" value={experience} onChange={(e) => setExperience(e.target.value)}>
              <option value="">Prefer not to say</option>
              {EXPERIENCE.map(([v, label]) => (<option key={v} value={v}>{label}</option>))}
            </select>
          </label>

          <div className="eyebrow" style={{ margin: "6px 0 8px" }}>Topics ({answered} of {topics.length} answered)</div>
          <div className="stack" style={{ gap: 10 }}>
            {topics.map((t) => (
              <label key={t.concept} className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 550, minWidth: 140 }}>{t.name}</span>
                <select
                  className="select select-sm" style={{ minWidth: 200 }} aria-label={`How well do you know ${t.name}?`}
                  value={answers[t.concept] ?? ""}
                  onChange={(e) => setAnswers((a) => { const n = { ...a }; if (e.target.value === "") delete n[t.concept]; else n[t.concept] = Number(e.target.value); return n; })}
                >
                  <option value="">Not sure (skip)</option>
                  {LEVELS.map(([v, label]) => (<option key={v} value={v}>{label}</option>))}
                </select>
              </label>
            ))}
          </div>

          {error && <div role="alert" className="form-error">{error}</div>}
          <div className="row" style={{ marginTop: 18 }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>{busy ? "Saving..." : "Save my answers"}</button>
            <button type="button" className="btn btn-lg" onClick={() => go("#/")}>Skip for now</button>
          </div>
          <p className="faint" style={{ fontSize: 12.5, marginTop: 12 }}>Your answers are stored with your account like the rest of your learning data, and "Delete my learning data" removes them.</p>
        </form>
      </div>
    </div>
  );
}
