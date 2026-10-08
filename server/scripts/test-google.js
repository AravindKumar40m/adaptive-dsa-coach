// Google sign-in, end to end, against a local stand-in for Google. Starts its OWN API copy on port 4101 (your dev
// server on 4000 is not touched). Needs MongoDB. Test accounts end in @example.test and are removed afterwards.
// Run: npm run test:google
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { config } from "../src/config.js";
import { eraseLearnerData } from "../src/erase.js";
import { ConsentEvent } from "../src/models/ConsentEvent.js";
import { PendingSignup } from "../src/models/PendingSignup.js";
import { Session } from "../src/models/Session.js";
import { User } from "../src/models/User.js";
import { startFakeGoogle } from "./lib/fake-google.js";
import { makeClient, newUser } from "./lib/client.js";

const PORT = 4101;
const base = `http://localhost:${PORT}`;
const api = `${base}/api`;
const redirectUri = `${base}/api/auth/google/callback`;
let failures = 0;
const check = (ok, label, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`); };
const tag = () => randomBytes(4).toString("hex");

const fake = await startFakeGoogle({ clientId: "test-client-id", clientSecret: "test-client-secret", redirectUri });
const spawnApi = (port, extra = {}) => spawn(process.execPath, ["src/index.js"], {
  env: { ...process.env, PORT: String(port), GOOGLE_CLIENT_ID: "test-client-id", GOOGLE_CLIENT_SECRET: "test-client-secret",
    GOOGLE_REDIRECT_URI: redirectUri, GOOGLE_AUTH_URL: fake.authUrl, GOOGLE_TOKEN_URL: fake.tokenUrl, AUTH_GOOGLE_ATTEMPTS: "1000", ...extra },
  stdio: ["ignore", "ignore", "pipe"],
});
const server = spawnApi(PORT);
let serverErrors = "";
server.stderr.on("data", (d) => (serverErrors += d));
for (let i = 0; i < 40; i++) { try { if ((await fetch(`${api}/health`)).status > 0) break; } catch { await new Promise((r) => setTimeout(r, 250)); } }

// A tiny browser: keeps cookies per host (like a real one), follows nothing by itself.
function browser() {
  const jar = new Map(); // host -> Map(name -> value)
  const cookieHeader = (host) => [...(jar.get(host) ?? new Map())].map(([k, v]) => `${k}=${v}`).join("; ");
  const store = (host, res) => {
    const m = jar.get(host) ?? new Map();
    for (const line of res.headers.getSetCookie()) {
      const [pair, ...attrs] = line.split("; ");
      const [name, ...rest] = pair.split("=");
      if (attrs.some((a) => /^Max-Age=0$/i.test(a))) m.delete(name); else m.set(name, rest.join("="));
    }
    jar.set(host, m);
  };
  const b = {
    jar,
    async get(url, extra = {}) {
      const host = new URL(url).hostname;
      const res = await fetch(url, { redirect: "manual", headers: { ...(cookieHeader(host) ? { cookie: cookieHeader(host) } : {}), ...extra } });
      store(host, res);
      return res;
    },
    async post(path, body) {
      const host = new URL(base).hostname;
      const res = await fetch(api + path, { method: "POST", headers: { "content-type": "application/json", cookie: cookieHeader(host) }, body: JSON.stringify(body ?? {}) });
      store(host, res);
      let json = null; try { json = await res.json(); } catch { /* none */ }
      return { status: res.status, json };
    },
    async getJson(path) {
      const res = await b.get(api + path);
      let json = null; try { json = await res.json(); } catch { /* none */ }
      return { status: res.status, json };
    },
    has: (name) => jar.get(new URL(base).hostname)?.has(name) ?? false,
    /** Click "Continue with Google": start -> Google -> callback. Returns where the app sends the browser afterwards. */
    async signIn({ tamper } = {}) {
      const start = await b.get(`${api}/auth/google/start`);
      const toGoogle = start.headers.get("location");
      let googleReply = await b.get(toGoogle);
      let callback = googleReply.headers.get("location");
      if (tamper) callback = tamper(callback);
      const back = await b.get(callback);
      return { start, toGoogle, callback, back, where: new URL(back.headers.get("location") ?? "/", base) };
    },
  };
  return b;
}

const emails = [];
const newEmail = () => { const e = `test-g-${tag()}@example.test`; emails.push(e); return e; };
const identity = (email, extra = {}) => fake.set({ mode: "ok", identity: { email, sub: `sub-${tag()}`, verified: true, ...extra } });

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
try {
  // ---- availability
  check((await (await fetch(`${api}/auth/google/status`)).json()).enabled === true, "with keys set, /auth/google/status says enabled");
  const devStatus = await (await fetch(`http://localhost:${config.port}/api/auth/google/status`)).json().catch(() => null);
  if (devStatus && !process.env.GOOGLE_CLIENT_ID) check(devStatus.enabled === false, "your normal dev server has no keys, so the button stays hidden there");

  // ---- the request we send to Google
  const email1 = newEmail(); const sub1 = `sub-${tag()}`;
  fake.set({ mode: "ok", identity: { email: email1, sub: sub1, verified: true } });
  const b1 = browser();
  const flow1 = await b1.signIn();
  const q = new URL(flow1.toGoogle).searchParams;
  check(flow1.start.status === 303 && flow1.toGoogle.startsWith(fake.authUrl), "start sends the browser to Google");
  check(q.get("client_id") === "test-client-id" && q.get("redirect_uri") === redirectUri && q.get("response_type") === "code", "client id, exact redirect address and response type are sent");
  check(q.get("scope") === "openid email", "only the 'openid email' permissions are requested (no name, no photo)");
  check(q.get("code_challenge_method") === "S256" && q.get("code_challenge")?.length === 43, "a PKCE challenge (S256) is sent");
  check(q.get("state")?.length >= 30 && q.get("nonce")?.length >= 30 && q.get("state") !== q.get("nonce"), "random state and nonce are sent");
  check(!flow1.toGoogle.includes("test-client-secret") && !flow1.toGoogle.includes("verifier"), "the client secret and PKCE verifier never appear in the address");
  const setCookie = flow1.start.headers.getSetCookie().join("\n");
  check(/g_oauth=/.test(setCookie) && /HttpOnly/i.test(setCookie) && /SameSite=Lax/i.test(setCookie), "the attempt's secrets live in an HttpOnly SameSite=Lax cookie");
  const tokenReq = fake.state.tokenRequests.at(-1);
  check(tokenReq.client_secret === "test-client-secret" && tokenReq.code_verifier?.length >= 43 && tokenReq.grant_type === "authorization_code", "the code is exchanged server to server with the secret and the PKCE verifier");

  // ---- a brand-new person: no account until they agree
  check(flow1.where.search === "?auth_notice=consent" && b1.has("g_pending") && !b1.has("session"), "a new person is sent back to finish signing up, with no session yet");
  check((await User.countDocuments({ email: email1 })) === 0, "no account exists before they agree to the consent");
  check((await PendingSignup.countDocuments({ email: email1 })) === 1, "only a short-lived pending row holds their Google id and email");
  check((await b1.getJson("/auth/google/pending")).json?.email === email1, "the page can ask who is waiting (shows the email)");
  check((await b1.getJson("/auth/me")).status === 401, "and they are not logged in");
  let r = await b1.post("/auth/google/complete", {});
  check(r.status === 400 && r.json.needsConsent === true, "finishing without agreeing to the recording is refused");
  check((await User.countDocuments({ email: email1 })) === 0, "...and still no account");
  r = await b1.post("/auth/google/complete", { acceptRecording: true, acceptAi: false });
  check(r.status === 201 && r.json.user.email === email1 && r.json.user.google === true && r.json.user.hasPassword === false, "agreeing creates a Google-only account");
  check(b1.has("session") && !b1.has("g_pending"), "the session starts and the pending cookie is cleared");
  const u1 = await User.findOne({ email: email1 }).lean();
  check(u1.googleSub === sub1 && !u1.passwordHash && u1.consent.recording?.version && u1.consent.ai === null, "stored: Google id, no password, the consent version agreed to, AI consent off");
  check((await ConsentEvent.countDocuments({ userId: u1._id, kind: "recording", accepted: true })) === 1, "the agreement was logged as a consent event");
  check((await PendingSignup.countDocuments({ email: email1 })) === 0, "the pending row is gone");
  check((await b1.getJson("/auth/me")).json?.user?.learnerId === u1.learnerId, "the new account works");
  check((await b1.post("/auth/google/complete", { acceptRecording: true })).status === 410, "the same pending sign-up cannot be used twice");

  // ---- the same person again: straight in, no new account, no consent screen
  const b2 = browser();
  const flow2 = await b2.signIn();
  check(flow2.where.search === "" && b2.has("session"), "a returning person is logged in straight away");
  check((await User.countDocuments({ email: email1 })) === 1, "no second account is created");
  check((await b2.getJson("/auth/me")).json?.user?.learnerId === u1.learnerId, "they get their own learner back");
  check((await b2.getJson(`/learners/${u1.learnerId}/skills`)).status === 200, "and can use the app");

  // ---- Google-only accounts have no password
  const loginRes = await fetch(`${api}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: email1, password: "anything-at-all-123" }) });
  const unknownRes = await fetch(`${api}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: `nobody-${tag()}@example.test`, password: "anything-at-all-123" }) });
  check(loginRes.status === 401 && (await loginRes.json()).error === (await unknownRes.json()).error, "password login for a Google-only account fails with the same message as an unknown email");

  // ---- an existing password account with the same email: linked, password and logins killed
  const pwUser = await newUser(api); // test-xxxx@example.test with a password
  const oldPassword = pwUser.password;
  emails.push(pwUser.email);
  const oldSession = (await User.findOne({ email: pwUser.email }))._id;
  check((await Session.countDocuments({ userId: oldSession })) === 1, "setup: the password account has a login");
  identity(pwUser.email);
  const b3 = browser();
  const flow3 = await b3.signIn();
  check(flow3.where.search === "?auth_notice=linked" && b3.has("session"), "Google for an existing password account's email logs in and says the accounts were linked");
  check((await User.countDocuments({ email: pwUser.email })) === 1 && (await b3.getJson("/auth/me")).json?.user?.learnerId === pwUser.learnerId, "it is the SAME account (same learner id, nothing duplicated)");
  const linked = await User.findOne({ email: pwUser.email }).lean();
  check(linked.googleSub && linked.passwordHash === null, "the Google id is stored and the old password is disabled");
  check((await pwUser.get("/auth/me")).status === 401, "the old password login session was ended (a pre-registering attacker is locked out)");
  const oldPwLogin = await fetch(`${api}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: pwUser.email, password: oldPassword }) });
  check(oldPwLogin.status === 401, "the old password no longer works");

  // ---- attacks and failures: nothing may log anyone in
  const attack = async (label, run, expectError) => {
    const b = browser();
    const usersBefore = await User.countDocuments(); const pendingBefore = await PendingSignup.countDocuments();
    const flow = await run(b);
    const error = flow.where.searchParams.get("auth_error");
    check(error === expectError && !b.has("session") && !b.has("g_pending"), `${label}: refused (${error})`);
    check((await User.countDocuments()) === usersBefore && (await PendingSignup.countDocuments()) === pendingBefore, `${label}: nothing was created`);
  };
  identity(newEmail());
  await attack("a wrong state in the address (login CSRF)", (b) => b.signIn({ tamper: (cb) => cb.replace(/state=[^&]+/, "state=forged") }), "failed");
  await attack("a callback without the attempt cookie", async (b) => {
    const a = browser(); const s = await a.get(`${api}/auth/google/start`); const g = await a.get(s.headers.get("location"));
    const back = await b.get(g.headers.get("location")); // a different browser follows someone else's callback
    return { where: new URL(back.headers.get("location") ?? "/", base) };
  }, "failed");
  await attack("a missing code", (b) => b.signIn({ tamper: (cb) => cb.replace(/code=[^&]+&?/, "") }), "failed");
  await attack("a made-up code", (b) => b.signIn({ tamper: (cb) => cb.replace(/code=[^&]+/, "code=made-up") }), "failed");
  const replayed = browser(); const f = await replayed.signIn(); // ok once...
  const again = await replayed.get(f.callback); // ...and the same callback replayed
  check(new URL(again.headers.get("location"), base).searchParams.get("auth_error") === "failed", "replaying an already used callback address is refused");
  for (const [mode, label] of [["bad-aud", "a token meant for another app"], ["bad-iss", "a token from another issuer"], ["bad-nonce", "a token with the wrong nonce"], ["expired", "an expired token"]]) {
    fake.set({ mode, identity: { email: newEmail(), sub: `sub-${tag()}`, verified: true } });
    await attack(label, (b) => b.signIn(), "failed");
  }
  fake.set({ mode: "ok", identity: { email: newEmail(), sub: `sub-${tag()}`, verified: false } });
  await attack("an unverified Google email", (b) => b.signIn(), "unverified");
  fake.set({ mode: "deny", identity: { email: newEmail(), sub: `sub-${tag()}`, verified: true } });
  await attack("the person pressing Cancel at Google", (b) => b.signIn(), "cancelled");
  identity(newEmail());

  // an account whose email now belongs to a different Google id is not taken over
  const squat = newEmail();
  await User.create({ email: squat, googleSub: `sub-${tag()}`, learnerId: crypto.randomUUID() });
  fake.set({ mode: "ok", identity: { email: squat, sub: `sub-${tag()}`, verified: true } });
  await attack("a different Google id claiming an existing Google account's email", (b) => b.signIn(), "conflict");

  // ---- the attempt limit (a second API copy that allows only 2 steps)
  const strict = spawnApi(4102, { AUTH_GOOGLE_ATTEMPTS: "2" });
  try {
    for (let i = 0; i < 40; i++) { try { if ((await fetch("http://localhost:4102/api/health")).status > 0) break; } catch { await new Promise((r) => setTimeout(r, 250)); } }
    const where = [];
    for (let i = 0; i < 3; i++) where.push(new URL((await fetch("http://localhost:4102/api/auth/google/start", { redirect: "manual" })).headers.get("location"), "http://localhost:4102").searchParams.get("auth_error") ?? "to-google");
    check(JSON.stringify(where) === '["to-google","to-google","too_many"]', "the third sign-in attempt from one address in a row is refused (too_many)", JSON.stringify(where));
  } finally { strict.kill(); }

  // ---- pending sign-up: cancel and expiry
  const emailC = newEmail(); identity(emailC);
  const bc = browser(); await bc.signIn();
  check((await PendingSignup.countDocuments({ email: emailC })) === 1, "setup: a pending sign-up exists");
  await bc.post("/auth/google/cancel");
  check((await PendingSignup.countDocuments({ email: emailC })) === 0 && (await bc.getJson("/auth/google/pending")).status === 404, "cancel forgets the pending sign-up");
  const emailE = newEmail(); identity(emailE);
  const be = browser(); await be.signIn();
  await PendingSignup.updateOne({ email: emailE }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  r = await be.post("/auth/google/complete", { acceptRecording: true });
  check(r.status === 410 && (await User.countDocuments({ email: emailE })) === 0, "an expired pending sign-up cannot be completed");

  // ---- AI consent chosen on the Google sign-up screen is stored
  const emailA = newEmail(); identity(emailA);
  const ba = browser(); await ba.signIn();
  r = await ba.post("/auth/google/complete", { acceptRecording: true, acceptAi: true });
  check(r.json?.user?.aiFeedback === true, "the optional AI box ticked on the Google sign-up screen is saved");

  // ---- deleting a Google-only account (no password to type)
  const del = makeClient(api, { email: email1, password: "", learnerId: u1.learnerId, cookie: `session=${b2.jar.get("localhost").get("session")}` });
  const noConfirm = await del.del("/auth/account", {});
  const wrong = await del.del("/auth/account", { confirmEmail: "someone-else@example.test" });
  check(noConfirm.status === 403 && wrong.status === 403 && (await User.countDocuments({ email: email1 })) === 1, "deleting needs the email typed exactly (nothing else works)");
  const ok = await del.del("/auth/account", { confirmEmail: email1.toUpperCase() });
  check(ok.status === 200 && (await User.countDocuments({ email: email1 })) === 0, "typing the email deletes the account");
  fake.set({ mode: "ok", identity: { email: email1, sub: sub1, verified: true } });
  const gone = browser(); const reflow = await gone.signIn(); // the same Google person again, after deleting everything
  check(reflow.where.search === "?auth_notice=consent" && !gone.has("session") && (await User.countDocuments({ email: email1 })) === 0, "after deletion the same Google person starts over as a new person (consent screen, no account)");
} finally {
  for (const u of await User.find({ email: { $in: emails } }).lean()) {
    await eraseLearnerData(u.learnerId); await Session.deleteMany({ userId: u._id }); await ConsentEvent.deleteMany({ userId: u._id }); await User.deleteOne({ _id: u._id });
  }
  await PendingSignup.deleteMany({ email: /@example\.test$/ });
  server.kill(); await fake.close();
  await mongoose.disconnect();
}
const unexpected = serverErrors.split("\n").filter((l) => l && !/Google sign-in refused/.test(l));
check(unexpected.length === 0, "the API logged no unexpected errors", unexpected.slice(0, 2).join(" | "));
check(!serverErrors.includes("test-client-secret"), "the client secret never appears in the server log");
console.log(failures === 0 ? "\nAll Google sign-in checks passed." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
