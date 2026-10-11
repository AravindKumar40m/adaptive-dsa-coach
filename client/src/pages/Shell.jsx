import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { clearDrafts, go, useRoute, useTheme } from "../lib/hooks.js";
import { PathView } from "./PathView.jsx";
import { PlacementView } from "./PlacementView.jsx";
import { ProblemsView } from "./ProblemsView.jsx";
import { TopBar } from "../components/TopBar.jsx";
import { Workspace } from "../workspace/Workspace.jsx";

// Everything after login: loads the shared data once and shows the Path, the Problems library or the Practice workspace.
export function Shell({ user, welcome = "", onWelcomeShown, onUser, onLogout, onAccountDeleted }) {
  const route = useRoute();
  const [theme, setTheme] = useTheme();
  const [health, setHealth] = useState(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [problems, setProblems] = useState([]);
  const [skills, setSkills] = useState(null);
  const [recommendation, setRecommendation] = useState(null); // { problem, reason, expectedSuccess, ... } or { done }
  const [skipped, setSkipped] = useState([]); // problems skipped in this session
  const [nextBusy, setNextBusy] = useState(false);
  const [toast, setToast] = useState(welcome);
  const [dataVersion, setDataVersion] = useState(0);
  const [placement, setPlacement] = useState(null); // { done, answers, experience }: the optional self-assessment
  const [lastSlug, setLastSlug] = useState(null);
  const learnerId = user.learnerId;
  useEffect(() => { onWelcomeShown?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshSkills = useCallback(() => {
    api(`/learners/${learnerId}/skills`).then((r) => r.ok && setSkills(r.data));
  }, [learnerId]);

  const loadNext = useCallback(async (exclude) => {
    const r = await api(`/learners/${learnerId}/next?exclude=${exclude.join(",")}`);
    if (r.ok) setRecommendation(r.data);
    return r.ok ? r.data : null;
  }, [learnerId]);

  useEffect(() => {
    api("/health").then((r) => setHealth(r.ok ? r.data : { api: false, mongo: false, judge0: false }));
    api("/ai/status").then((r) => setAiEnabled(!!r.data.enabled));
    api("/problems").then((r) => r.ok && setProblems(r.data));
    refreshSkills();
    loadNext([]);
    api(`/learners/${learnerId}/placement`).then((r) => r.ok && setPlacement(r.data));
  }, [refreshSkills, loadNext, learnerId]);

  // coming back to the Path: make sure the recommendation reflects what was just solved
  useEffect(() => { if (route.name === "path") loadNext(skipped); }, [route.name]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (route.name === "practice") setLastSlug(route.slug); }, [route]);

  // "skipSlug" = a problem the learner is moving past without solving; goToIt = open the new problem straight away
  async function advance(skipSlug, goToIt, reason) {
    setNextBusy(true);
    // a skip is a signal worth keeping (with the reason when the learner gave one)
    if (skipSlug) await api("/problem-event", { method: "POST", body: { problem: skipSlug, kind: "skipped", value: reason ?? "no_reason" } });
    const exclude = skipSlug ? [...new Set([...skipped, skipSlug])] : skipped;
    if (skipSlug) setSkipped(exclude);
    const next = await loadNext(exclude);
    setNextBusy(false);
    if (!next) return setToast("Could not get the next problem.");
    if (next.done) return setToast(next.reason);
    if (goToIt) go(`#/practice/${next.problem.slug}?src=rec`);
  }

  async function deleteMyData() {
    if (!window.confirm("Delete all the code and run history we recorded for you? Your account stays.")) return;
    const r = await api(`/learners/${learnerId}/data`, { method: "DELETE" });
    if (!r.ok) return setToast("Could not delete your data right now.");
    clearDrafts(learnerId);
    setDataVersion((v) => v + 1);
    setPlacement({ done: false, answers: {}, experience: null });
    setSkipped([]);
    refreshSkills();
    loadNext([]);
    setToast(`Deleted ${r.data.deleted} recorded runs and your skill ratings.`);
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 7000);
    return () => clearTimeout(t);
  }, [toast]);

  const practiceSlug = route.name === "practice" ? route.slug : lastSlug ?? (recommendation && !recommendation.done ? recommendation.problem.slug : null);
  const open = (slug, src = "library") => go(`#/practice/${slug}?src=${src}`); // src = how the learner got here (logged)

  return (
    <div className="app">
      <TopBar route={route} practiceHref={practiceSlug ? `#/practice/${practiceSlug}` : "#/"} health={health} theme={theme} onTheme={setTheme}
        user={user} aiAvailable={aiEnabled} onUser={onUser} onLogout={onLogout} onDeleteData={deleteMyData} onAccountDeleted={onAccountDeleted} />
      <div style={{ minHeight: 0, position: "relative" }}>
        {route.name === "placement" && (
          <PlacementView skills={skills} existing={placement} onSaved={(p) => { setPlacement(p); setToast("Thanks. We will use your answers as a rough starting guess; real results always win."); refreshSkills(); loadNext(skipped); }} />
        )}
        {route.name === "path" && (
          <PathView user={user} placement={placement} skills={skills} problems={problems} recommendation={recommendation} busy={nextBusy}
            onStart={(slug) => open(slug, "rec")} onSkip={(reason) => recommendation && !recommendation.done && advance(recommendation.problem.slug, false, reason)} />
        )}
        {route.name === "problems" && (
          <ProblemsView key={route.params.concept ?? ""} problems={problems} skills={skills} initialConcept={route.params.concept}
            recommendedSlug={recommendation && !recommendation.done ? recommendation.problem.slug : null} onOpen={open} />
        )}
        {route.name === "practice" && (
          <Workspace user={user} slug={route.slug} source={route.params.src} recommendation={recommendation} aiEnabled={aiEnabled} theme={theme} dataVersion={dataVersion}
            onUser={onUser} onSolved={() => { refreshSkills(); }} onNext={(skipCurrent, reason) => advance(skipCurrent ? route.slug : null, true, reason)} nextBusy={nextBusy} />
        )}
        {toast && <div className="toast" role="status">{toast} <button className="btn btn-ghost" onClick={() => setToast("")} aria-label="Dismiss">×</button></div>}
      </div>
    </div>
  );
}
