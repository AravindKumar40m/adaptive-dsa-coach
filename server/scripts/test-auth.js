// HTTP test of accounts, sessions, consent and the guard on learner routes. The API must be running (npm run dev).
// Every account it creates ends in @example.test and is deleted at the end. Run: npm run test:auth
import mongoose from "mongoose";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { config } from "../src/config.js";
import { CONSENT_VERSION } from "../src/consent.js";
import { ConsentEvent } from "../src/models/ConsentEvent.js";
import { HintEvent } from "../src/models/HintEvent.js";
import { Session } from "../src/models/Session.js";
import { Submission } from "../src/models/Submission.js";
import { User } from "../src/models/User.js";
import { makeClient, newUser } from "./lib/client.js";

const base = `http://localhost:${config.port}/api`;
let failures = 0;
const check = (ok, label, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`); };
const raw = async (method, path, body, headers = {}) => {
  const res = await fetch(base + path, { method, headers: { ...(body === undefined ? {} : { "content-type": "application/json" }), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
  let json = null; try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, json, headers: res.headers };
};
const tag = () => randomBytes(5).toString("hex");
const GOOD = "def peak_altitude(changes):\n    best = h = 0\n    for c in changes:\n        h += c\n        best = max(best, h)\n    return best\n";

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
const users = [];
try {
  // ---- public things stay public
  check((await raw("GET", "/problems")).status === 200 && (await raw("GET", "/concepts")).status === 200, "problems and concepts are public");
  const text = (await raw("GET", "/consent")).json;
  check(text.version === CONSENT_VERSION && text.recording.required === true && text.ai.required === false && text.recording.points.length >= 3, "the consent wording is served with its version; recording is required, AI is optional");

  // ---- nothing about a learner works without a login
  for (const [m, p] of [["GET", "/learners/abc/skills"], ["GET", "/learners/abc/next"], ["GET", "/learners/abc/hints/peak-altitude"], ["DELETE", "/learners/abc/data"], ["POST", "/run"], ["POST", "/submit"], ["POST", "/hint"], ["POST", "/feedback"]]) {
    const r = await raw(m, p, m === "GET" ? undefined : {});
    check(r.status === 401 && r.json.needsLogin === true, `${m} ${p} without login is 401`, `(${r.status})`);
  }
  check((await raw("GET", "/auth/me")).status === 401, "/auth/me without login is 401");

  // ---- sign-up checks
  const email = `test-${tag()}@example.test`;
  const pw = `pw-${tag()}-long`;
  const signup = (b) => raw("POST", "/auth/signup", b);
  check((await signup({ email, password: pw })).status === 400, "sign-up without agreeing to the recording is refused");
  check((await signup({ email, password: pw, acceptRecording: "yes" })).status === 400, "only the real value true counts as agreement (not the text 'yes')");
  check((await signup({ email: "not-an-email", password: pw, acceptRecording: true })).status === 400, "bad email is refused");
  check((await signup({ email, password: "short", acceptRecording: true })).status === 400, "password under 10 characters is refused");
  check((await signup({ email, password: "x".repeat(129), acceptRecording: true })).status === 400, "password over 128 characters is refused");
  const named = `test-${tag()}`;
  check((await signup({ email: `${named}@example.test`, password: `${named}-extra`, acceptRecording: true })).status === 400, "password containing the email name is refused");
  check((await signup({ email, password: { $gt: "" }, acceptRecording: true })).status === 400, "an object instead of a password (injection try) is refused");
  check((await User.countDocuments({ email })) === 0, "refused sign-ups created no account");

  // ---- a good sign-up
  const ok = await signup({ email: email.toUpperCase(), password: pw, acceptRecording: true, acceptAi: false });
  const me = makeClient(base, { email, password: pw, learnerId: ok.json?.user?.learnerId, cookie: ok.headers.getSetCookie()[0]?.split(";")[0] });
  users.push(me);
  check(ok.status === 201 && ok.json.user.email === email, "good sign-up works; the email is stored in lower case");
  const setCookie = ok.headers.getSetCookie()[0];
  check(/HttpOnly/i.test(setCookie) && /SameSite=Lax/i.test(setCookie) && /Path=\//.test(setCookie) && /Max-Age=\d+/.test(setCookie), "session cookie is HttpOnly + SameSite=Lax + has a lifetime", setCookie.replace(/session=[^;]+/, "session=<hidden>"));
  check(!JSON.stringify(ok.json).includes(pw) && !/scrypt|passwordHash/.test(JSON.stringify(ok.json)) && ok.json.user.hasPassword === true, "the response never contains the password or its hash (only a hasPassword flag)");
  check(ok.json.user.consentCurrent === true && ok.json.user.aiFeedback === false, "recording consent is on, AI consent stays off unless ticked");
  const row = await User.findOne({ email }).lean();
  check(row.passwordHash.startsWith("scrypt$") && !row.passwordHash.includes(pw), "only a scrypt hash of the password is stored");
  check(row.consent.recording.version === CONSENT_VERSION && row.consent.ai === null, "the consent version that was agreed to is stored");
  const sess = await Session.findOne({ userId: row._id }).lean();
  const cookieValue = setCookie.split(";")[0].split("=")[1];
  check(sess && sess.tokenHash !== cookieValue && !JSON.stringify(sess).includes(cookieValue), "the database holds only a hash of the session token");
  check((await ConsentEvent.countDocuments({ userId: row._id, kind: "recording", accepted: true, version: CONSENT_VERSION })) === 1, "the agreement was logged as a consent event");
  check((await signup({ email, password: pw, acceptRecording: true })).status === 409, "the same email twice is refused (409)");
  check((await signup({ email: ` ${email.toUpperCase()} `, password: pw, acceptRecording: true })).status === 409, "...also with different capitals and spaces");

  // ---- using the session
  const who = await me.get("/auth/me");
  check(who.status === 200 && who.json.user.learnerId === me.learnerId && who.json.consentVersion === CONSENT_VERSION, "/auth/me returns the logged-in person");
  check((await me.get(`/learners/${me.learnerId}/skills`)).status === 200, "own skills are readable");
  check((await me.get(`/learners/${randomBytes(4).toString("hex")}/skills`)).status === 403, "someone else's id in the URL is 403");
  const forged = await me.post("/submit", { problem: "peak-altitude", language: "python", code: GOOD, learnerId: "victim" });
  check(forged.status === 403, "a forged learnerId in the body is 403");
  const noBody = await me.post("/hint", { problem: "peak-altitude" });
  check(noBody.status === 200, "when no learnerId is sent the session decides who you are");
  check((await HintEvent.countDocuments({ learnerId: me.learnerId })) === 1, "...and the data lands under your own id");
  const fake = await fetch(`${base}/auth/me`, { headers: { cookie: "session=" + randomBytes(32).toString("base64url") } });
  check(fake.status === 401, "a made-up session cookie is rejected");

  // ---- cross-site requests
  const evil = await fetch(`${base}/hint`, { method: "POST", headers: { "content-type": "application/json", cookie: me.cookie, origin: "http://evil.example" }, body: JSON.stringify({ problem: "peak-altitude" }) });
  check(evil.status === 403, "a POST from another website's origin is refused even with a valid cookie");
  const same = await fetch(`${base}/hint`, { method: "POST", headers: { "content-type": "application/json", cookie: me.cookie, origin: `http://localhost:${config.port}` }, body: JSON.stringify({ problem: "peak-altitude" }) });
  check(same.status === 200, "a POST from our own origin works");
  const cors = await fetch(`${base}/problems`, { headers: { origin: "http://evil.example" } });
  check(!cors.headers.get("access-control-allow-origin"), "no CORS header: other websites cannot read API answers");

  // ---- login
  const login = (e, p) => raw("POST", "/auth/login", { email: e, password: p });
  const wrongPw = await login(email, "definitely-wrong-password");
  const noUser = await login(`nobody-${tag()}@example.test`, "definitely-wrong-password");
  check(wrongPw.status === 401 && noUser.status === 401 && wrongPw.json.error === noUser.json.error, "wrong password and unknown email give the same answer (no account guessing)");
  check(!wrongPw.headers.getSetCookie().length, "a failed login sets no cookie");
  const good = await login(email.toUpperCase(), pw);
  check(good.status === 200 && good.json.user.learnerId === me.learnerId && good.headers.getSetCookie().length === 1, "login works (any capitals) and returns the same learner");
  const second = makeClient(base, { email, password: pw, learnerId: me.learnerId, cookie: good.headers.getSetCookie()[0].split(";")[0] });
  check((await second.get("/auth/me")).status === 200 && (await me.get("/auth/me")).status === 200, "two devices can be logged in at once");

  // ---- login rate limit (own address pair: email + IP)
  const target = `test-${tag()}@example.test`;
  const codes = [];
  for (let i = 0; i < config.loginAttemptsPer15Min + 2; i++) codes.push((await login(target, "wrong-" + i)).status);
  check(codes.slice(0, config.loginAttemptsPer15Min).every((c) => c === 401) && codes.slice(config.loginAttemptsPer15Min).every((c) => c === 429), `after ${config.loginAttemptsPer15Min} wrong tries the same email is slowed down (429)`, JSON.stringify(codes.slice(-3)));
  check((await login(email, pw)).status === 200, "...but that does not block a different email");

  // ---- logout
  const out = await second.post("/auth/logout");
  check(out.status === 200 && /Max-Age=0/.test(out.headers.get("set-cookie") ?? ""), "logout clears the cookie");
  check((await second.get("/auth/me")).status === 401, "the logged-out session no longer works on the server");
  check((await me.get("/auth/me")).status === 200, "the other device stays logged in");

  // ---- expiry
  await Session.updateMany({ userId: row._id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  check((await me.get("/auth/me")).status === 401, "an expired session is rejected");
  const again = await login(email, pw);
  me.cookie = again.headers.getSetCookie()[0].split(";")[0];
  check(again.status === 200 && (await me.get("/auth/me")).status === 200, "logging in again works");

  // ---- the AI consent and the recording consent
  let r = await me.post("/auth/consent", { aiFeedback: true });
  check(r.json.user.aiFeedback === true, "opting in to AI works");
  r = await me.post("/auth/consent", { aiFeedback: false });
  check(r.json.user.aiFeedback === false && (await ConsentEvent.countDocuments({ userId: row._id, kind: "ai" })) === 2, "opting out works and both choices are logged");
  check((await me.post("/auth/consent", {})).status === 400, "an empty consent change is 400");

  // consent text changes -> must agree again before anything is recorded
  await User.updateOne({ _id: row._id }, { $set: { "consent.recording.version": "old-version" } });
  check((await me.get("/auth/me")).json.user.consentCurrent === false, "after the wording changes /auth/me says consent is no longer current");
  const blocked = await me.post("/submit", { problem: "peak-altitude", language: "python", code: GOOD });
  check(blocked.status === 403 && blocked.json.needsConsent === true, "recording is blocked until the learner agrees to the new wording");
  check((await Submission.countDocuments({ learnerId: me.learnerId })) === 0, "nothing was recorded while consent was out of date");
  check((await me.get(`/learners/${me.learnerId}/skills`)).status === 200, "reading and deleting your own data still works");
  await me.post("/auth/consent", { recording: true });
  check((await me.post("/run", { problem: "peak-altitude", language: "python", code: GOOD })).status === 200, "after agreeing again the platform works");

  // ---- withdrawing the recording consent stops recording
  await me.post("/auth/consent", { recording: false });
  check((await me.post("/hint", { problem: "peak-altitude" })).status === 403, "after withdrawing consent nothing more can be recorded");
  await me.post("/auth/consent", { recording: true });

  // ---- owner-run password reset
  const resetOut = execFileSync(process.execPath, ["--env-file=../.env", "scripts/reset-password.js", email.toUpperCase()], { encoding: "utf8" });
  const temporary = resetOut.match(/Temporary password for \S+: (\S+)/)?.[1];
  check(temporary && temporary.length >= 10 && /[1-9]\d* existing login/.test(resetOut), "reset-password prints a temporary password and ends the existing logins", `(${resetOut.split("\n")[1]})`);
  check((await me.get("/auth/me")).status === 401, "the old session stops working after a reset");
  check((await login(email, pw)).status === 401, "the old password stops working after a reset");
  const viaTemp = await login(email, temporary);
  check(viaTemp.status === 200 && viaTemp.json.user.learnerId === me.learnerId, "the temporary password logs in to the same learner");
  me.cookie = viaTemp.headers.getSetCookie()[0].split(";")[0];
  me.password = temporary;

  // ---- deleting the account
  const victim = await newUser(base);
  users.push(victim);
  await victim.post("/hint", { problem: "peak-altitude" });
  await victim.post("/submit", { problem: "peak-altitude", language: "python", code: GOOD, startedAt: new Date(Date.now() - 20000).toISOString() });
  const vrow = await User.findOne({ email: victim.email }).lean();
  check((await raw("DELETE", "/auth/account", { password: "x" })).status === 401, "deleting an account needs a login");
  const wrong = await victim.del("/auth/account", { password: "not-my-password" });
  check(wrong.status === 403 && (await User.countDocuments({ email: victim.email })) === 1, "deleting an account with the wrong password is refused");
  const del = await victim.del("/auth/account", { password: victim.password });
  check(del.status === 200 && del.json.deleted >= 1, "deleting with the right password works", `(${JSON.stringify(del.json)})`);
  const left = await Promise.all([
    User.countDocuments({ email: victim.email }), Session.countDocuments({ userId: vrow._id }), ConsentEvent.countDocuments({ userId: vrow._id }),
    Submission.countDocuments({ learnerId: victim.learnerId }), HintEvent.countDocuments({ learnerId: victim.learnerId }),
    mongoose.connection.collection("skillratings").countDocuments({ learnerId: victim.learnerId }),
    mongoose.connection.collection("ratingupdates").countDocuments({ learnerId: victim.learnerId }),
  ]);
  check(left.every((n) => n === 0), "account, sessions, consent log, submissions, hints and ratings are all gone", JSON.stringify(left));
  check((await victim.get("/auth/me")).status === 401, "the deleted account's cookie no longer works");
  check((await login(victim.email, victim.password)).status === 401, "the deleted account cannot log in");
  // other accounts were not touched
  check((await me.get("/auth/me")).status === 200 && (await Submission.countDocuments({ learnerId: me.learnerId })) >= 1, "deleting one account did not touch another");
} finally {
  for (const u of users) await u.deleteAccount().catch(() => {});
}
console.log(failures === 0 ? "\nAll account checks passed." : `\n${failures} CHECK(S) FAILED`);
await mongoose.disconnect();
process.exit(failures === 0 ? 0 : 1);
