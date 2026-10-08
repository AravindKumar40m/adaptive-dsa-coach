import { DifficultyBadge, Inline, prettyConcept } from "../ui.jsx";

export function ProblemPane({ problem, why, onSkip, skipLabel, disabled }) {
  if (!problem) return <div className="problem"><p className="muted">Loading problem...</p></div>;
  return (
    <article className="problem">
      <div className="tags">
        <span className="badge">{prettyConcept(problem.concept)}</span>
        <DifficultyBadge level={problem.difficulty} />
      </div>
      <h1>{problem.title}</h1>

      {why && <div className="callout why-box"><strong>Why this problem:</strong> {why}</div>}

      <div className="prose" style={{ marginTop: why ? 18 : 6 }}>
        {problem.statement.split("\n\n").map((para, i) => (<p key={i}><Inline text={para} /></p>))}
      </div>

      <div className="constraints">
        <div className="eyebrow">Constraints</div>
        <ul>{problem.constraints.map((c, i) => (<li key={i}><code>{c}</code></li>))}</ul>
      </div>

      {problem.examples.map((ex, i) => (
        <div key={i} className="example">
          <span className="eyebrow">Example {i + 1}</span>
          <dl className="io" style={{ margin: 0 }}>
            <dt>Call</dt><dd>{problem.signature.name}({ex.args.map((a) => JSON.stringify(a)).join(", ")})</dd>
            <dt>Returns</dt><dd>{JSON.stringify(ex.expected)}</dd>
          </dl>
          {ex.explanation && <div className="explain">{ex.explanation}</div>}
        </div>
      ))}

      <div className="problem-foot">
        <button className="btn btn-ghost" onClick={onSkip} disabled={disabled}>{skipLabel}</button>
      </div>
    </article>
  );
}
