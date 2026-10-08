import { useEffect, useState } from "react";
import { api } from "./api.js";
import { GOOGLE_ERRORS } from "./authQuery.js";
import { Branch, Logo, Shield, Target } from "./icons.jsx";

// Shows the consent wording exactly as the server stores it (same text, same version).
export function ConsentBlock({ block }) {
  return (
    <div className="consent">
      <strong>{block.title}</strong>
      <p style={{ margin: "6px 0 4px" }}>{block.intro}</p>
      <ul>{block.points.map((p) => (<li key={p}>{p}</li>))}</ul>
      <p>{block.outro}</p>
    </div>
  );
}

export function useConsentText() {
  const [text, setText] = useState(null);
  useEffect(() => { api("/consent").then((r) => r.ok && setText(r.data)); }, []);
  return text;
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/** Login / sign-up page. onDone(user) is called after a successful login or sign-up. */
export function AuthScreen({ onDone, fromGoogle = {}, onUsed }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptRecording, setAcceptRecording] = useState(false);
  const [acceptAi, setAcceptAi] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleOn, setGoogleOn] = useState(false);
  const [pending, setPending] = useState(null); // { email } = Google confirmed this person, they still have to agree
  const consent = useConsentText();

  useEffect(() => {
    api("/auth/google/status").then((r) => setGoogleOn(!!r.data.enabled));
    onUsed?.(); // the message belongs to this one visit: a later logout must not show it again
    if (fromGoogle.error) setError(GOOGLE_ERRORS[fromGoogle.error] ?? GOOGLE_ERRORS.failed);
    if (fromGoogle.notice === "consent") api("/auth/google/pending").then((r) => (r.ok ? setPending({ email: r.data.email }) : setError("That Google sign-in expired. Please try again.")));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function finishGoogle(e) {
    e.preventDefault();
    setError("");
    if (!acceptRecording) { setError("Please tick the box to agree to the recording of your practice. Without it we cannot adapt the problems to you."); return; }
    setBusy(true);
    const r = await api("/auth/google/complete", { method: "POST", body: { acceptRecording, acceptAi } });
    setBusy(false);
    if (r.ok) onDone(r.data.user);
    else { setError(r.data.error ?? "Something went wrong."); if (r.status === 410) setPending(null); }
  }
  async function cancelGoogle() {
    await api("/auth/google/cancel", { method: "POST" });
    setPending(null); setError(""); setAcceptRecording(false); setAcceptAi(false);
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (mode === "signup" && !acceptRecording) { setError("Please tick the box to agree to the recording of your practice. Without it we cannot adapt the problems to you."); return; }
    setBusy(true);
    const r = await api(mode === "login" ? "/auth/login" : "/auth/signup", {
      method: "POST",
      body: mode === "login" ? { email, password } : { email, password, acceptRecording, acceptAi },
    });
    setBusy(false);
    if (r.ok) onDone(r.data.user);
    else setError(r.data.error ?? "Something went wrong.");
  }

  return (
    <div className="auth">
      <aside className="auth-side">
        <div className="brand"><Logo size={28} /> Adaptive DSA Coach</div>
        <h1>Practice that fits where you are.</h1>
        <p className="lead">A coach for data structures and algorithms. It watches how you solve, not only whether the tests pass, and picks your next problem to match.</p>
        <ul className="auth-points">
          <li><Target /><span><b>One problem at a time.</b> Chosen from your weakest open topic, at a level you can just about reach.</span></li>
          <li><Branch /><span><b>A map of what you know.</b> Every topic has its own rating, and unlocks the ones that build on it.</span></li>
          <li><Shield /><span><b>You stay in control.</b> Hints are optional and cost a little score. You can delete your data any time.</span></li>
        </ul>
      </aside>

      <main className="auth-main">
        {pending ? (
          <form className="auth-card stack" style={{ gap: 14 }} onSubmit={finishGoogle}>
            <h2>One last step</h2>
            <div className="muted">Google confirmed <strong>{pending.email}</strong>. Your account is created only after you agree below.</div>
            {consent && (
              <>
                <ConsentBlock block={consent.recording} />
                <label className="check">
                  <input type="checkbox" checked={acceptRecording} onChange={(e) => setAcceptRecording(e.target.checked)} />
                  <span><strong>Required:</strong> I agree to the recording of my practice as described above.</span>
                </label>
                <ConsentBlock block={consent.ai} />
                <label className="check">
                  <input type="checkbox" checked={acceptAi} onChange={(e) => setAcceptAi(e.target.checked)} />
                  <span><strong>Optional:</strong> I allow my code to be sent to Anthropic when I ask the AI tutor to explain a result.</span>
                </label>
              </>
            )}
            {error && <div role="alert" className="form-error">{error}</div>}
            <div className="row">
              <button type="submit" disabled={busy} className="btn btn-primary btn-lg">{busy ? "Please wait..." : "Create account"}</button>
              <button type="button" className="btn btn-lg" onClick={cancelGoogle}>Cancel</button>
            </div>
          </form>
        ) : (
        <div className="auth-card">
          <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <div className="muted">{mode === "login" ? "Log in to continue where you stopped." : "It takes a minute. No email is sent."}</div>

          <div className="tabs" role="tablist" aria-label="Log in or create an account">
            <button type="button" role="tab" className="tab" aria-selected={mode === "login"} onClick={() => { setMode("login"); setError(""); }}>Log in</button>
            <button type="button" role="tab" className="tab" aria-selected={mode === "signup"} onClick={() => { setMode("signup"); setError(""); }}>Create account</button>
          </div>

          {googleOn && (
            <>
              <a className="google-btn" href="/api/auth/google/start"><GoogleLogo /> Continue with Google</a>
              <div className="or"><span>or use email</span></div>
            </>
          )}

          <form onSubmit={submit} className="stack" style={{ gap: 14 }}>
            <label className="field"><span>Email</span>
              <input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="field"><span>Password {mode === "signup" && <small className="faint">(at least 10 characters)</small>}</span>
              <input className="input" type="password" required minLength={mode === "signup" ? 10 : undefined} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>

            {mode === "signup" && consent && (
              <>
                <ConsentBlock block={consent.recording} />
                <label className="check">
                  <input type="checkbox" checked={acceptRecording} onChange={(e) => setAcceptRecording(e.target.checked)} />
                  <span><strong>Required:</strong> I agree to the recording of my practice as described above.</span>
                </label>
                <ConsentBlock block={consent.ai} />
                <label className="check">
                  <input type="checkbox" checked={acceptAi} onChange={(e) => setAcceptAi(e.target.checked)} />
                  <span><strong>Optional:</strong> I allow my code to be sent to Anthropic when I ask the AI tutor to explain a result.</span>
                </label>
              </>
            )}

            {error && <div role="alert" className="form-error">{error}</div>}
            <button type="submit" disabled={busy} className="btn btn-primary btn-lg">
              {busy ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>
        </div>
        )}
      </main>
    </div>
  );
}

/** Shown when the wording of the consent changed since the learner agreed: nothing is recorded until they agree again. */
export function ConsentGate({ user, onUser, onLogout }) {
  const consent = useConsentText();
  const [error, setError] = useState("");
  async function agree() {
    const r = await api("/auth/consent", { method: "POST", body: { recording: true } });
    if (r.ok) onUser(r.data.user); else setError(r.data.error ?? "Something went wrong.");
  }
  return (
    <div className="gate">
      <div className="brand" style={{ marginBottom: 20 }}><Logo size={28} /> Adaptive DSA Coach</div>
      <h2 style={{ fontSize: 22, marginBottom: 6 }}>We updated how we describe the recording</h2>
      <p className="muted">Signed in as <strong>{user.email}</strong>. Until you agree, nothing you do is recorded and you cannot run or submit code.</p>
      {consent && <ConsentBlock block={consent.recording} />}
      {error && <div role="alert" className="form-error">{error}</div>}
      <div className="row" style={{ marginTop: 16 }}>
        <button onClick={agree} className="btn btn-primary btn-lg">I agree</button>
        <button onClick={onLogout} className="btn btn-lg">Log out</button>
      </div>
    </div>
  );
}
