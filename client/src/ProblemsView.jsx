import { useMemo, useState } from "react";
import { Check, Lock, Search } from "./icons.jsx";
import { DifficultyBadge, prettyConcept } from "./ui.jsx";

const DIFFS = ["all", "easy", "medium", "hard"];
const STATUSES = [["all", "All"], ["open", "Open"], ["solved", "Solved"]];

export function ProblemsView({ problems, skills, recommendedSlug, initialConcept, onOpen }) {
  const [query, setQuery] = useState("");
  const [concept, setConcept] = useState(initialConcept ?? "all");
  const [difficulty, setDifficulty] = useState("all");
  const [status, setStatus] = useState("all");

  const solved = useMemo(() => new Set(skills?.solvedProblems ?? []), [skills]);
  const concepts = useMemo(() => new Map((skills?.skills ?? []).map((s) => [s.concept, s])), [skills]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return problems.filter((p) =>
      (concept === "all" || p.concept === concept) &&
      (difficulty === "all" || p.difficulty === difficulty) &&
      (status === "all" || (status === "solved") === solved.has(p.slug)) &&
      (!q || p.title.toLowerCase().includes(q) || prettyConcept(p.concept).includes(q))
    );
  }, [problems, query, concept, difficulty, status, solved]);

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">Problems</h1>
        <p className="page-sub">Everything in the library. You can open any problem, but the Path picks for you based on your ratings.</p>

        <div className="toolbar">
          <label className="search">
            <span className="sr-only">Search problems</span>
            <Search size={15} />
            <input className="input" placeholder="Search by title or topic" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <select className="select select-sm" style={{ height: 34 }} value={concept} onChange={(e) => setConcept(e.target.value)} aria-label="Topic">
            <option value="all">All topics</option>
            {(skills?.skills ?? []).filter((s) => s.total > 0).map((s) => (<option key={s.concept} value={s.concept}>{s.name}</option>))}
          </select>
          <div className="seg" role="group" aria-label="Difficulty">
            {DIFFS.map((d) => (<button key={d} aria-pressed={difficulty === d} onClick={() => setDifficulty(d)}>{d === "all" ? "Any level" : d}</button>))}
          </div>
          <div className="seg" role="group" aria-label="Status">
            {STATUSES.map(([k, label]) => (<button key={k} aria-pressed={status === k} onClick={() => setStatus(k)}>{label}</button>))}
          </div>
          <span className="faint num" style={{ marginLeft: "auto" }}>{rows.length} of {problems.length}</span>
        </div>

        <div className="table-wrap">
          {rows.length === 0 ? <div className="empty">No problem matches these filters.</div> : (
            <table className="table">
              <thead><tr><th style={{ width: 44 }}><span className="sr-only">Status</span></th><th>Title</th><th>Topic</th><th>Level</th></tr></thead>
              <tbody>
                {rows.map((p) => {
                  const c = concepts.get(p.concept);
                  const isSolved = solved.has(p.slug);
                  return (
                    <tr key={p.slug} className="row-link" onClick={() => onOpen(p.slug)}>
                      <td>{isSolved ? <Check size={16} style={{ color: "var(--ok)" }} aria-label="Solved" /> : c && !c.unlocked ? <Lock size={14} style={{ color: "var(--text-faint)" }} aria-label="Topic locked" /> : null}</td>
                      <td className="title">
                        <a href={`#/practice/${p.slug}`} onClick={(e) => e.stopPropagation()} style={{ color: "var(--text)" }}>{p.title}</a>{" "}
                        {p.slug === recommendedSlug && <span className="badge badge-accent" style={{ marginLeft: 6 }}>Recommended</span>}
                      </td>
                      <td className="muted">{prettyConcept(p.concept)}</td>
                      <td><DifficultyBadge level={p.difficulty} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
