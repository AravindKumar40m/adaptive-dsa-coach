import { SkillMap } from "../components/SkillMap.jsx";
import { Arrow } from "../components/icons.jsx";
import { DifficultyBadge, greeting, prettyConcept } from "../components/ui.jsx";
import { SkipWithReason } from "../workspace/Feedback.jsx";

const SLOT_LABEL = { warmup: "Warm-up", core: "Core", stretch: "Stretch" };

export function PathView({ user, placement, skills, problems, recommendation, onStart, onSkip, busy }) {
  const solved = skills?.solvedProblems?.length ?? 0;
  const unlocked = skills ? skills.skills.filter((s) => s.unlocked && s.total > 0).length : 0;
  const topics = skills ? skills.skills.filter((s) => s.total > 0).length : 0;
  const rated = skills ? skills.skills.filter((s) => s.attempts > 0) : [];
  const strongest = rated.length ? rated.reduce((a, b) => (b.rating > a.rating ? b : a)) : null;
  const rec = recommendation && !recommendation.done ? recommendation : null;

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">{greeting()}.</h1>
        <p className="page-sub">Here is your path. We pick one problem at a time, from the weakest topic that is open to you.</p>

        <section className="card hero" aria-label="Recommended problem">
          {rec ? (
            <>
              <div>
                <div className="eyebrow">{rec.mode === "review" ? "Review recommended" : "Recommended next"}</div>
                <h2>{rec.problem.title}</h2>
                <div className="meta">
                  {rec.mode === "review" && <span className="badge badge-accent">Review</span>}
                  <span className="badge">{prettyConcept(rec.problem.concept)}</span>
                  <DifficultyBadge level={rec.problem.difficulty} />
                  {rec.slot && <span className="badge badge-accent">{SLOT_LABEL[rec.slot]}</span>}
                </div>
                <p className="why">{rec.reason}</p>
                <div className="expected" title="How likely we think you are to solve it, from your rating and the problem's current difficulty">
                  <span>Expected success</span>
                  <div className="progress"><i style={{ width: `${Math.round(rec.expectedSuccess * 100)}%` }} /></div>
                  <b className="num">{Math.round(rec.expectedSuccess * 100)}%</b>
                </div>
              </div>
              <div className="actions">
                <button className="btn btn-primary btn-lg" onClick={() => onStart(rec.problem.slug)}>Start this problem <Arrow /></button>
                <SkipWithReason label="Show me another" className="btn" onSkip={onSkip} disabled={busy} />
              </div>
            </>
          ) : (
            <div>
              <div className="eyebrow">Recommended next</div>
              <h2>{recommendation?.done ? "You have worked through everything." : "Loading your next problem..."}</h2>
              {recommendation?.done && <p className="why">{recommendation.reason}</p>}
            </div>
          )}
        </section>

        {placement && !placement.done && (
          <section className="card" style={{ marginTop: 14, padding: "14px 18px", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }} aria-label="Optional self-assessment">
            <div style={{ maxWidth: "62ch" }}>
              <strong>Tell us where you are (1 minute, optional)</strong>
              <div className="muted" style={{ fontSize: 13.5 }}>Rate each topic and the first problems will fit you a bit better. It is only a rough starting guess: real results always win.</div>
            </div>
            <a className="btn" href="#/placement">Start</a>
          </section>
        )}

        <div className="stats">
          <div className="card stat"><b>{solved}<span className="faint" style={{ fontSize: 15, fontWeight: 400 }}> / {problems.length}</span></b><span>problems solved</span></div>
          <div className="card stat"><b>{unlocked}<span className="faint" style={{ fontSize: 15, fontWeight: 400 }}> / {topics}</span></b><span>topics open</span></div>
          <div className="card stat"><b>{strongest ? Math.round(strongest.rating) : "—"}</b><span>{strongest ? `strongest: ${strongest.name}` : "your first rating appears after a submit"}</span></div>
        </div>

        <div className="section-head">
          <h3>Skill map</h3>
          <div className="legend">
            <span><i style={{ borderStyle: "solid" }} />open</span>
            <span><i style={{ borderStyle: "dashed" }} />locked: solve 2 problems in the topic before it</span>
            <span><i style={{ borderColor: "var(--ok)" }} />all solved</span>
          </div>
        </div>
        {skills ? <SkillMap skills={skills.skills.filter((s) => s.total > 0)} startRating={skills.startRating} onOpen={(c) => (window.location.hash = `#/problems?concept=${c}`)} /> : <div className="card empty">Loading...</div>}

        {placement?.done && <p className="footnote" style={{ marginTop: 20 }}>You filled in the self-assessment. <a href="#/placement">Update it</a></p>}

        <p className="footnote">
          Ratings start at {skills?.startRating ?? 1000} in every topic and move only when you press Submit. Run never changes them.
          We record the code you run or submit, its results and the hints you open, only inside the editor. {user.aiFeedback ? "AI explanations are on for your account." : "AI explanations are off for your account."} Everything is in the Account menu, including deleting your data.
        </p>
      </div>
    </div>
  );
}
