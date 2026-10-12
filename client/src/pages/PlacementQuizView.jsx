import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api.js";
import { go } from "../lib/hooks.js";

// The placement quiz: about 10 minutes of short multiple-choice questions that set where each topic starts.
// The server chooses every question and checks every answer; this page only shows them. The right answers and the
// explanations arrive only on the results page, after the quiz is finished.
const LETTERS = ["A", "B", "C", "D"];
const CONFIDENCE = { low: "from one question", medium: "from two questions" };

function Code({ text }) {
  return text ? <pre className="codeblock mono quiz-code">{text}</pre> : null;
}

function Results({ r, onDone }) {
  const [showReview, setShowReview] = useState(false);
  return (
    <>
      <h1 className="page-title">Your starting point.</h1>
      <p className="page-sub">You answered <b>{r.correct} of {r.answered}</b> questions right{r.stoppedEarly ? " (you stopped early, so some topics were not asked)" : ""}. Here is where each topic starts. They are only starting points: real practice moves them quickly.</p>

      {r.placed.length > 0 && (
        <div className="callout ok" style={{ marginTop: 14 }}>
          <b>Placed out:</b> {r.placed.map((p) => p.name).join(", ")}. You showed you know {r.placed.length === 1 ? "this" : "these"}, so what depends on {r.placed.length === 1 ? "it" : "them"} is open without the warm-up problems.
        </div>
      )}
      {r.kept.length > 0 && (
        <p className="faint" style={{ marginTop: 10, fontSize: 13 }}>Left as they were, because you already have real results there: {r.kept.map((k) => k.name).join(", ")}.</p>
      )}

      <section className="card skill-list" style={{ marginTop: 16 }} aria-label="Starting ratings">
        {r.topics.map((t) => (
          <div key={t.concept} className="quiz-topic">
            <b>{t.name}</b>
            <span className="muted">{t.label}</span>
            <span className="faint" style={{ fontSize: 12.5 }}>{CONFIDENCE[t.confidence]}</span>
            <span className="num" style={{ marginLeft: "auto" }}>{t.rating}{t.applied ? "" : " (kept)"}</span>
          </div>
        ))}
      </section>
      <p className="faint" style={{ fontSize: 12.5, marginTop: 8 }}>Topics that were not asked (because a topic they depend on needs the basics first, or you stopped) start at 1000 like everyone's.</p>

      <div className="row" style={{ marginTop: 18, gap: 10, flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-lg" onClick={onDone}>See my path</button>
        <button className="btn btn-lg" onClick={() => setShowReview(!showReview)} aria-expanded={showReview}>{showReview ? "Hide my answers" : "Review my answers"}</button>
      </div>

      {showReview && (
        <section className="stack" style={{ marginTop: 18, gap: 12 }} aria-label="Your answers">
          {r.review.map((q, i) => (
            <div key={i} className="card pad">
              <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                <span className="badge">{q.name}</span>
                <span className={`badge ${q.right ? "badge-ok" : "badge-bad"}`}>{q.right ? "Right" : q.yourAnswer == null ? "You did not know" : "Not quite"}</span>
              </div>
              <p style={{ marginBottom: 6 }}>{q.prompt}</p>
              <Code text={q.code} />
              {!q.right && q.yourAnswer != null && <p className="muted" style={{ marginTop: 6 }}>Your answer: <code>{q.yourAnswer}</code></p>}
              <p style={{ marginTop: 6 }}>Right answer: <code>{q.correctAnswer}</code></p>
              <p className="muted" style={{ marginTop: 6 }}>{q.explain}</p>
            </div>
          ))}
        </section>
      )}
    </>
  );
}

export function PlacementQuizView({ onFinished }) {
  const [status, setStatus] = useState(null); // from GET /quiz/status
  const [quiz, setQuiz] = useState(null); // { quizId, question, progress }
  const [picked, setPicked] = useState(null); // option id chosen, or -1 for "I don't know"
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const shownAt = useRef(Date.now());

  useEffect(() => { api("/quiz/status").then((r) => (r.ok ? setStatus(r.data) : setError(r.data.error ?? "Could not load the quiz."))); }, []);
  useEffect(() => { shownAt.current = Date.now(); setPicked(null); }, [quiz?.question?.id]);

  async function start(restart = false) {
    setBusy(true); setError("");
    const r = await api("/quiz/start", { method: "POST", body: { restart } });
    setBusy(false);
    if (!r.ok) return setError(r.data.error ?? "Could not start the quiz.");
    setQuiz(r.data);
  }
  async function seeLast() {
    const r = await api("/quiz/results");
    if (r.ok) setResults(r.data); else setError(r.data.error ?? "Could not load your result.");
  }
  function handle(r) {
    if (r.data.done) { setResults(r.data.results); setQuiz(null); onFinished?.(); return; }
    if (r.status === 409 && r.data.question) { setQuiz((q) => ({ ...q, question: r.data.question, progress: r.data.progress })); return; } // out of step: show the real current question
    if (!r.ok) return setError(r.data.error ?? "Something went wrong.");
    setQuiz((q) => ({ ...q, question: r.data.question, progress: r.data.progress }));
  }
  async function submit() {
    if (picked === null || busy) return;
    setBusy(true); setError("");
    const r = await api("/quiz/answer", { method: "POST", body: { quizId: quiz.quizId, item: quiz.question.id, choice: picked, ms: Date.now() - shownAt.current } });
    setBusy(false);
    handle(r);
  }
  async function stop() {
    setBusy(true); setError("");
    const r = await api("/quiz/finish", { method: "POST", body: { quizId: quiz.quizId } });
    setBusy(false);
    handle(r);
  }

  let body;
  if (results) {
    body = <Results r={results} onDone={() => go("#/")} />;
  } else if (quiz) {
    const { question: q, progress: p } = quiz;
    body = (
      <>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <span className="eyebrow">Question {q.number} · up to {p.max}</span>
          <span className="badge">{q.topic}</span>
        </div>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={p.max} aria-valuenow={p.answered} aria-label="Quiz progress"><i style={{ width: `${(100 * p.answered) / p.max}%` }} /></div>
        <section className="card pad" style={{ marginTop: 14 }} aria-label="Question">
          <p className="quiz-prompt">{q.prompt}</p>
          <Code text={q.code} />
          <div className="quiz-options" role="radiogroup" aria-label="Choose one answer">
            {q.options.map((o, i) => (
              <button key={o.id} className="opt" role="radio" aria-checked={picked === o.id} aria-pressed={picked === o.id} onClick={() => setPicked(o.id)} disabled={busy}>
                <b>{LETTERS[i]}</b><span className={q.kind === "trace" ? "mono" : ""}>{o.text}</span>
              </button>
            ))}
            <button className="opt opt-dk" role="radio" aria-checked={picked === -1} aria-pressed={picked === -1} onClick={() => setPicked(-1)} disabled={busy}>
              <b>?</b><span>I don't know</span>
            </button>
          </div>
          {error && <div role="alert" className="form-error">{error}</div>}
          <div className="row" style={{ marginTop: 16, gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-primary btn-lg" onClick={submit} disabled={picked === null || busy}>{busy ? "Checking..." : "Answer"}</button>
            {p.canStop && <button className="btn btn-ghost" onClick={stop} disabled={busy}>Stop and see my results</button>}
          </div>
        </section>
        <p className="faint" style={{ fontSize: 12.5, marginTop: 10 }}>The code is shown in Python, whatever language you practise in. Guessing is fine, "I don't know" is fine too: it tells us as much. You will see the right answers at the end.</p>
      </>
    );
  } else if (!status) {
    body = <div className="card empty">{error || "Loading..."}</div>;
  } else {
    body = (
      <>
        <h1 className="page-title">Placement quiz.</h1>
        <p className="page-sub">About 10 minutes of short questions, so your first problems fit you instead of starting everyone at the same level. It starts in the middle of each topic and gets easier or harder with your answers; if a topic is new to you it stops early. Nothing here is a grade, and you can stop at any time after 6 answers.</p>
        <section className="card pad" style={{ marginTop: 16 }}>
          <ul className="plain-list" style={{ gap: 8 }}>
            <li><span>Multiple choice, or "what does this code print?"</span></li>
            <li><span>Topics you clearly know open up what depends on them</span></li>
            <li><span>Real practice always beats the quiz: a topic you already practised keeps its rating</span></li>
          </ul>
          {!status.available && <div className="callout bad" style={{ marginTop: 12 }}>The quiz is not set up on this server yet.</div>}
          {error && <div role="alert" className="form-error">{error}</div>}
          <div className="row" style={{ marginTop: 16, gap: 10, flexWrap: "wrap" }}>
            {status.inProgress
              ? <>
                  <button className="btn btn-primary btn-lg" onClick={() => start(false)} disabled={busy || !status.available}>Continue ({status.inProgress.answered} answered)</button>
                  <button className="btn btn-lg" onClick={() => start(true)} disabled={busy}>Start again</button>
                </>
              : <button className="btn btn-primary btn-lg" onClick={() => start(false)} disabled={busy || !status.available}>{status.last ? "Take it again" : "Start the quiz"}</button>}
            {status.last && <button className="btn btn-lg" onClick={seeLast}>See my last result</button>}
            <button className="btn btn-ghost" onClick={() => go("#/")}>Not now</button>
          </div>
          {status.last && <p className="faint" style={{ fontSize: 12.5, marginTop: 10 }}>You finished it before: {status.last.correct} of {status.last.answered} right, {status.last.placed} {status.last.placed === 1 ? "topic" : "topics"} placed out. Taking it again only changes topics you have not practised yet.</p>}
        </section>
      </>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 760 }}>{body}</div>
    </div>
  );
}
