import Editor from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { loadDraft, removeDraft, saveDraft, useSplit } from "../hooks.js";
import { Play, Reset, Send } from "../icons.jsx";
import { EDITOR_OPTIONS, defineLamplightThemes } from "../monacoTheme.js";
import { LANGUAGES } from "../ui.jsx";
import { ConsolePane } from "./ConsolePane.jsx";
import { HelpPane } from "./HelpPane.jsx";
import { ProblemPane } from "./ProblemPane.jsx";

export function Workspace({ user, slug, recommendation, aiEnabled, theme, dataVersion, onUser, onSolved, onNext, nextBusy }) {
  const learnerId = user.learnerId;
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState("python");
  const [drafts, setDrafts] = useState({}); // "slug:language" -> code (also kept in this tab's sessionStorage)
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("run");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [startedAt, setStartedAt] = useState(null); // when this problem was opened (the time part of the score)
  const [hints, setHints] = useState({ revealed: [], next: 1 });
  const [feedback, setFeedback] = useState(null); // { text } | { error } | { busy: true }
  const [leftTab, setLeftTab] = useState("problem");
  const [mobilePane, setMobilePane] = useState("problem");

  const left = useSplit({ initial: 520, min: 340, max: 900, axis: "x", storeKey: "split-left" });
  const consoleH = useSplit({ initial: 330, min: 120, max: 620, axis: "y", reverse: true, storeKey: "split-console" });

  // load the problem and any hints already opened
  useEffect(() => {
    setProblem(null); setResult(null); setFeedback(null); setError(""); setLeftTab("problem");
    setHints({ revealed: [], next: 1 });
    api(`/learners/${learnerId}/hints/${slug}`).then((r) => r.ok && setHints({ revealed: r.data.revealed ?? [], next: r.data.next ?? null }));
    api(`/problems/${slug}`).then((r) => {
      if (r.ok) { setProblem(r.data); setStartedAt(new Date().toISOString()); } else setError("Could not load the problem.");
    });
  }, [slug, learnerId]);

  // the learner deleted their learning data from the Account menu
  useEffect(() => {
    if (!dataVersion) return;
    setResult(null); setFeedback(null); setHints({ revealed: [], next: 1 }); setDrafts({});
  }, [dataVersion]);

  const draftKey = `${slug}:${language}`;
  const code = drafts[draftKey] ?? loadDraft(learnerId, draftKey) ?? problem?.starters?.[language] ?? "";
  const solvedHere = result?.mode === "submit" && result?.verdict === "accepted" && result?.problem === slug;

  async function send(which) {
    if (busy || !problem) return;
    setBusy(true); setMode(which); setError("");
    const r = await api(`/${which}`, { method: "POST", body: { problem: slug, language, code, startedAt } });
    if (r.data.needsConsent) onUser({ ...user, consentCurrent: false }); // the wording changed in the meantime: ask again
    else if (!r.ok) setError(r.data.error ?? "Something went wrong.");
    else { setResult(r.data); if (which === "submit") onSolved(); }
    setBusy(false);
  }

  async function revealHint() {
    const r = await api("/hint", { method: "POST", body: { problem: slug } });
    if (r.data.needsConsent) onUser({ ...user, consentCurrent: false });
    else if (r.ok) setHints({ revealed: r.data.revealed, next: r.data.next });
    else setError(r.data.error ?? "Could not get a hint.");
  }

  async function explainResult() {
    setFeedback({ busy: true });
    const r = await api("/feedback", { method: "POST", body: { problem: slug, language, code, result } });
    setFeedback(r.ok ? { text: r.data.text } : { error: r.data.error ?? "The AI tutor is unavailable." });
  }

  // keyboard: Ctrl+Enter = Run, Ctrl+Shift+Enter = Submit (works inside the editor and outside it)
  const latest = useRef({});
  latest.current = { send };
  useEffect(() => {
    const on = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); latest.current.send(e.shiftKey ? "submit" : "run"); }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);
  const onMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => latest.current.send("run"));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => latest.current.send("submit"));
  };

  const why = recommendation && !recommendation.done && recommendation.problem.slug === slug
    ? recommendation.reason + (recommendation.repeated ? " (You skipped everything that is left, so a skipped problem is offered again.)" : "")
    : null;
  const showAi = aiEnabled && user.aiFeedback && result && result.verdict !== "accepted";
  const aiHint = aiEnabled
    ? (user.aiFeedback ? "After a run that does not pass, an AI explanation can be requested here." : "AI explanations are off. You can turn them on in the Account menu.")
    : null;

  return (
    <div className="workspace-wrap">
      <div className="mobile-switch">
        <div className="seg" role="group" aria-label="Show">
          <button aria-pressed={mobilePane === "problem"} onClick={() => setMobilePane("problem")}>Problem</button>
          <button aria-pressed={mobilePane === "code"} onClick={() => setMobilePane("code")}>Code</button>
        </div>
      </div>
      <div className="workspace" style={{ "--left": `min(${left.size}px, 70vw)` }}>
        <section className={`pane ${mobilePane === "problem" ? "" : "hide-mobile"}`} aria-label="Problem">
          <div className="tabs" role="tablist">
            <button role="tab" className="tab" aria-selected={leftTab === "problem"} onClick={() => setLeftTab("problem")}>Problem</button>
            <button role="tab" className="tab" aria-selected={leftTab === "help"} onClick={() => setLeftTab("help")}>
              Hints {hints.revealed.length > 0 && <span className="count">{hints.revealed.length}</span>}
            </button>
          </div>
          <div className="pane-body">
            {leftTab === "problem"
              ? <ProblemPane problem={problem} why={why} disabled={nextBusy} skipLabel={solvedHere ? "Next problem →" : "Skip to another problem"} onSkip={() => onNext(!solvedHere)} />
              : <HelpPane hints={hints} onHint={revealHint} disabled={busy || !problem} showAi={showAi} aiHint={aiHint} feedback={feedback} onExplain={explainResult} />}
          </div>
        </section>

        <div className={`splitter ${left.dragging ? "dragging" : ""}`} role="separator" aria-orientation="vertical" aria-label="Resize panels" {...left.handleProps} />

        <section className={`pane ${mobilePane === "code" ? "" : "hide-mobile"}`} aria-label="Code">
          <div className="editor-head">
            <select className="select select-sm" value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Language">
              {LANGUAGES.map((l) => (<option key={l.key} value={l.key}>{l.label}</option>))}
            </select>
            <button className="btn btn-ghost" disabled={busy || !problem} title="Back to the starter code"
              onClick={() => { setDrafts((d) => { const n = { ...d }; delete n[draftKey]; return n; }); removeDraft(learnerId, draftKey); }}>
              <Reset size={15} /> <span className="label">Reset</span>
            </button>
            <div className="spacer" />
            <button className="btn" onClick={() => send("run")} disabled={busy || !problem} title="Run the examples (Ctrl+Enter)"><Play size={14} /> Run</button>
            <button className="btn btn-primary" onClick={() => send("submit")} disabled={busy || !problem} title="Submit for grading (Ctrl+Shift+Enter)"><Send size={14} /> Submit</button>
          </div>

          <div className="editor-box">
            {problem ? (
              <Editor
                height="100%"
                path={`${slug}.${language}`}
                language={LANGUAGES.find((l) => l.key === language).monaco}
                value={code}
                onChange={(v) => { const val = v ?? ""; saveDraft(learnerId, draftKey, val); setDrafts((d) => ({ ...d, [draftKey]: val })); }}
                theme={theme === "dark" ? "lamplight-dark" : "lamplight-paper"}
                beforeMount={defineLamplightThemes}
                onMount={onMount}
                options={EDITOR_OPTIONS}
              />
            ) : <div className="centered">Loading the editor...</div>}
          </div>

          <div className={`splitter-h ${consoleH.dragging ? "dragging" : ""}`} role="separator" aria-orientation="horizontal" aria-label="Resize results" {...consoleH.handleProps} />
          <div className="console" style={{ "--console-h": `${consoleH.size}px` }}>
            <div className="tabs"><span className="tab" aria-selected="true" style={{ cursor: "default" }}>Results</span></div>
            {error && <div className="callout bad" style={{ margin: "10px 16px 0" }} role="alert">{error}</div>}
            <ConsolePane busy={busy} mode={mode} result={result} solved={solvedHere} onNext={() => onNext(false)} />
          </div>
        </section>
      </div>
    </div>
  );
}
