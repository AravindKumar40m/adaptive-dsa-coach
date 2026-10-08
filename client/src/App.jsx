import { useEffect, useState } from "react";
import { api, setSessionLostHandler } from "./api.js";
import { consumeAuthQuery } from "./authQuery.js";
import { AuthScreen, ConsentGate } from "./Auth.jsx";
import { Shell } from "./Shell.jsx";

// The part you open first: decides between login, "please agree again" and the coach.
export default function App() {
  const [user, setUser] = useState(undefined); // undefined = still checking, null = logged out
  const [fromGoogle, setFromGoogle] = useState(consumeAuthQuery); // { error, notice } when the browser just came back from Google (used once)
  const used = () => setFromGoogle({});

  useEffect(() => {
    setSessionLostHandler(() => setUser(null));
    api("/auth/me").then((r) => setUser(r.ok ? r.data.user : null));
  }, []);

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
  }

  if (user === undefined) return <div className="centered">Loading...</div>;
  if (user === null) return <AuthScreen onDone={setUser} fromGoogle={fromGoogle} onUsed={used} />;
  if (!user.consentCurrent) return <ConsentGate user={user} onUser={setUser} onLogout={logout} />;
  // key = learner: switching accounts always starts from a clean screen
  return <Shell key={user.learnerId} onWelcomeShown={used} welcome={fromGoogle.notice === "linked" ? "Google is now linked to your existing account. Your old password was turned off: sign in with Google from now on." : ""} user={user} onUser={setUser} onLogout={logout} onAccountDeleted={() => setUser(null)} />;
}
