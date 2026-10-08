import { useState } from "react";
import { api } from "./api.js";
import { useConsentText } from "./Auth.jsx";
import { useDismiss } from "./hooks.js";
import { Chevron, Logo, Moon, Sun } from "./icons.jsx";
import { initialOf } from "./ui.jsx";

function SystemStatus({ health }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const parts = health ? [["API", health.api], ["MongoDB", health.mongo], ["Judge0 (runs your code)", health.judge0]] : [];
  const allOk = health && parts.every(([, ok]) => ok);
  return (
    <div className="popover-wrap hide-sm" ref={ref}>
      <button className="btn btn-ghost" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="System status" title="System status">
        <span className={`status-dot ${!health ? "unknown" : allOk ? "" : "down"}`} />
        <span className="faint" style={{ fontSize: 12.5 }}>{!health ? "Checking" : allOk ? "All systems up" : "Problem"}</span>
      </button>
      {open && health && (
        <div className="popover" style={{ width: 260 }}>
          <h4>System status</h4>
          <div className="stack">
            {parts.map(([name, ok]) => (<div key={name} className="row"><span className={`status-dot ${ok ? "" : "down"}`} /> <span>{name}</span> <span className="faint" style={{ marginLeft: "auto" }}>{ok ? "up" : "down"}</span></div>))}
          </div>
        </div>
      )}
    </div>
  );
}

function AccountMenu({ user, aiAvailable, onUser, onLogout, onDeleteData, onAccountDeleted }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState(""); // the password, or (Google-only accounts) the email typed to confirm
  const [error, setError] = useState("");
  const consent = useConsentText();
  const ref = useDismiss(open, () => setOpen(false));

  async function toggleAi(on) {
    const r = await api("/auth/consent", { method: "POST", body: { aiFeedback: on } });
    if (r.ok) onUser(r.data.user); else setError(r.data.error ?? "Could not change that.");
  }
  async function deleteAccount(e) {
    e.preventDefault();
    setError("");
    const r = await api("/auth/account", { method: "DELETE", body: user.hasPassword ? { password } : { confirmEmail: password } });
    if (r.ok) onAccountDeleted(); else setError(r.data.error ?? "Could not delete the account.");
  }

  return (
    <div className="popover-wrap" ref={ref}>
      <button className="btn btn-ghost" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Account">
        <span className="avatar">{initialOf(user.email)}</span>
        <Chevron size={14} />
        <span className="sr-only">Account</span>
      </button>
      {open && (
        <div className="popover">
          <div className="row" style={{ marginBottom: 12 }}>
            <span className="avatar">{initialOf(user.email)}</span>
            <div style={{ minWidth: 0 }}>
              <div className="faint" style={{ fontSize: 12 }}>Signed in as</div>
              <div style={{ fontWeight: 600, overflowWrap: "anywhere" }}>{user.email}</div>
              {user.google && <div className="faint" style={{ fontSize: 12 }}>Signed in with Google</div>}
            </div>
          </div>

          <label className="check">
            <input type="checkbox" checked={user.aiFeedback} onChange={(e) => toggleAi(e.target.checked)} />
            <span>Allow AI explanations <span className="faint" style={{ fontSize: 12.5 }}>(sends your code for that problem to Anthropic when you click "Explain my result")</span></span>
          </label>
          {!aiAvailable && <div className="faint" style={{ fontSize: 12.5, marginTop: 6 }}>The AI tutor is not switched on on this server yet, so nothing is sent either way.</div>}
          {consent && <details style={{ fontSize: 12.5, marginTop: 6 }} className="muted"><summary>What this means</summary>{consent.ai.points.map((p) => (<div key={p}>• {p}</div>))}</details>}

          <hr />
          <div className="faint" style={{ fontSize: 12.5, marginBottom: 8 }}>We record the code you run or submit here, its results and the hints you open. Nothing outside this editor.</div>
          <div className="stack">
            <button onClick={() => { setOpen(false); onDeleteData(); }} className="btn">Delete my learning data (keep account)</button>
            <button onClick={onLogout} className="btn">Log out</button>
            {!confirming && <button onClick={() => setConfirming(true)} className="btn btn-danger">Delete my account…</button>}
          </div>

          {confirming && (
            <form onSubmit={deleteAccount} style={{ marginTop: 12 }}>
              <div className="muted" style={{ fontSize: 13 }}>This removes your account, your email and everything we recorded. It cannot be undone. {user.hasPassword ? "Enter your password to confirm:" : "Type your email address to confirm:"}</div>
              <input className="input" type={user.hasPassword ? "password" : "email"} required autoComplete={user.hasPassword ? "current-password" : "off"} value={password} onChange={(e) => setPassword(e.target.value)}
                aria-label={user.hasPassword ? "Password to confirm" : "Email to confirm"} style={{ marginTop: 8 }} />
              <div className="row" style={{ marginTop: 8 }}>
                <button type="submit" className="btn btn-danger-solid">Delete everything</button>
                <button type="button" onClick={() => { setConfirming(false); setPassword(""); setError(""); }} className="btn">Cancel</button>
              </div>
            </form>
          )}
          {error && <div role="alert" className="form-error" style={{ fontSize: 13 }}>{error}</div>}
        </div>
      )}
    </div>
  );
}

const NAV = [["path", "#/", "Path"], ["problems", "#/problems", "Problems"], ["practice", null, "Practice"]];

export function TopBar({ route, practiceHref, health, theme, onTheme, ...account }) {
  return (
    <header className="topbar">
      <a href="#/" className="brand" aria-label="Adaptive DSA Coach, home"><Logo size={26} /> <span className="brand-name">Coach</span> <small>adaptive DSA</small></a>
      <nav className="navlinks" aria-label="Main">
        {NAV.map(([name, href, label]) => (
          <a key={name} href={href ?? practiceHref} className="navlink" aria-current={route.name === name ? "page" : undefined}>{label}</a>
        ))}
      </nav>
      <div className="spacer" />
      <SystemStatus health={health} />
      <button className="btn btn-ghost btn-icon" onClick={() => onTheme(theme === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} title={theme === "dark" ? "Light mode (paper)" : "Dark mode (ink)"}>
        {theme === "dark" ? <Sun /> : <Moon />}
      </button>
      <AccountMenu {...account} />
    </header>
  );
}
