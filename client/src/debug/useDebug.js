import { useCallback, useMemo, useRef, useState } from "react";
import { api } from "../lib/api.js";
import { analyze, backOver, nextBreak, nextChange, prevBreak, prevChange, stepOut, stepOver } from "./model.js";

// parameter types the server can trace today (server/src/debug/runner.js TRACEABLE_TYPES)
const TRACEABLE = new Set(["int", "bool", "string", "int[]", "int[][]"]);
export const canStepThrough = (problem, language) => language === "python" && Boolean(problem?.signature?.params?.every((p) => TRACEABLE.has(p.type)));

/**
 * One "step through my code" session. `session` is null when the debugger is off. While it is on, the code in the editor is frozen
 * (the code that was traced), and the learner moves through the recorded run with no further calls to the server.
 *   session = { code, source, status: "loading" | "ready" | "error", error?, data?, an?, step, breaks: Set<line> }
 */
export function useDebug(slug, language) {
  const [stored, setSession] = useState(null);
  // a session belongs to the problem and language it was started on: on the very first render after either changes it is already off,
  // so the editor is writable again at once (a read-only editor reports programmatic value changes as edits, which would be saved as drafts)
  const session = stored && stored.slug === slug && stored.language === language ? stored : null;
  const ticket = useRef(0); // a newer request makes older answers ignored (the learner clicked another input meanwhile)

  const run = useCallback(async (code, source, keepBreaks = new Set()) => {
    const mine = ++ticket.current;
    setSession({ slug, language, code, source, status: "loading", step: 0, breaks: keepBreaks });
    const r = await api("/debug", { method: "POST", body: { problem: slug, code, source } });
    if (mine !== ticket.current) return;
    if (!r.ok) { setSession({ slug, language, code, source, status: "error", error: r.data.error ?? "Could not step through this run.", step: 0, breaks: keepBreaks }); return; }
    const an = analyze(r.data.trace);
    setSession({ slug, language, code, source, status: "ready", data: r.data, an, step: 0, breaks: keepBreaks });
  }, [slug, language]);

  const exit = useCallback(() => { ticket.current++; setSession(null); }, []);

  const actions = useMemo(() => {
    const move = (fn) => setSession((s) => (s?.status === "ready" ? { ...s, step: Math.max(0, Math.min(s.an.n - 1, fn(s.an, s.step, s))) } : s));
    return {
      goto: (i) => move(() => i),
      next: () => move((_an, i) => i + 1), back: () => move((_an, i) => i - 1),
      first: () => move(() => 0), last: () => move((an) => an.n - 1),
      over: () => move(stepOver), backOver: () => move(backOver), out: () => move(stepOut),
      nextChange: () => move(nextChange), prevChange: () => move(prevChange),
      cont: () => move((an, i, s) => nextBreak(an, i, s.breaks)), contBack: () => move((an, i, s) => prevBreak(an, i, s.breaks)),
      toggleBreak: (line) => setSession((s) => {
        if (!s) return s;
        const breaks = new Set(s.breaks);
        if (breaks.has(line)) breaks.delete(line); else breaks.add(line);
        return { ...s, breaks };
      }),
    };
  }, []);

  return { session, run, exit, actions };
}
