import { Router } from "express";
import { randomBytes, randomUUID } from "node:crypto";
import { config } from "../config.js";
import { parseCookies, publicUser, sha256, startSession } from "../auth.js";
import { CONSENT_VERSION } from "../consent.js";
import { GoogleAuthError, authorizeUrl, exchangeCode, googleEnabled, newAttempt } from "../google.js";
import { makeLimiter } from "../rateLimit.js";
import { ConsentEvent } from "../models/ConsentEvent.js";
import { PendingSignup } from "../models/PendingSignup.js";
import { Session } from "../models/Session.js";
import { User } from "../models/User.js";

const router = Router();
const attemptLimiter = makeLimiter(config.googleAttemptsPer15Min, 15 * 60 * 1000); // sign-in attempts per IP (start + callback share it)
const completeLimiter = makeLimiter(config.signupsPerHour, 3600 * 1000);

const OAUTH_COOKIE = "g_oauth"; // state + nonce + PKCE verifier of the attempt in progress (10 minutes)
const PENDING_COOKIE = "g_pending"; // "Google confirmed you, now agree to the consent" (15 minutes)
const PATH = "/api/auth/google";

const cookieFlags = (maxAge) => `HttpOnly; SameSite=Lax; Path=${PATH}; Max-Age=${maxAge}${config.cookieSecure ? "; Secure" : ""}`;
const setCookie = (res, name, value, maxAge) => res.append("Set-Cookie", `${name}=${value}; ${cookieFlags(maxAge)}`);
const clearCookie = (res, name) => setCookie(res, name, "", 0);
const stamp = () => ({ version: CONSENT_VERSION, at: new Date() });
const backToApp = (res, query = {}) => {
  const qs = new URLSearchParams(query).toString();
  res.redirect(303, qs ? `/?${qs}` : "/"); // a relative address: the page's own origin, whatever port the dev server uses
};

router.get("/auth/google/status", (_req, res) => res.json({ enabled: googleEnabled() }));

// Step 1: send the browser to Google.
router.get("/auth/google/start", (req, res) => {
  if (!googleEnabled()) return backToApp(res, { auth_error: "not_configured" });
  if (!attemptLimiter.take(req.ip).ok) return backToApp(res, { auth_error: "too_many" });
  const attempt = newAttempt();
  setCookie(res, OAUTH_COOKIE, Buffer.from(JSON.stringify(attempt)).toString("base64url"), 600);
  res.redirect(303, authorizeUrl(attempt));
});

// Step 2: Google sends the browser back here with a one-time code.
router.get("/auth/google/callback", async (req, res, next) => {
  try {
    if (!googleEnabled()) return backToApp(res, { auth_error: "not_configured" });
    if (!attemptLimiter.take(req.ip).ok) return backToApp(res, { auth_error: "too_many" });

    let attempt = null;
    try { attempt = JSON.parse(Buffer.from(parseCookies(req.headers.cookie)[OAUTH_COOKIE] ?? "", "base64url").toString("utf8")); } catch { /* handled below */ }
    clearCookie(res, OAUTH_COOKIE); // one attempt, one use

    if (req.query.error) return backToApp(res, { auth_error: req.query.error === "access_denied" ? "cancelled" : "failed" });
    // the state in the address must be the one only THIS browser received: stops someone else's sign-in being forced on you
    if (!attempt?.state || typeof req.query.state !== "string" || req.query.state !== attempt.state) return backToApp(res, { auth_error: "failed" });
    if (typeof req.query.code !== "string" || !req.query.code) return backToApp(res, { auth_error: "failed" });

    let who;
    try {
      who = await exchangeCode({ code: req.query.code, verifier: attempt.verifier, nonce: attempt.nonce });
    } catch (err) {
      if (err instanceof GoogleAuthError) {
        if (err.code === "failed") console.error("Google sign-in refused:", err.message);
        return backToApp(res, { auth_error: err.code });
      }
      throw err;
    }

    // 1. someone who signed in with this Google account before
    const known = await User.findOne({ googleSub: who.sub });
    if (known) {
      await startSession(res, known);
      return backToApp(res);
    }

    // 2. an account with this email that was made with a password
    const sameEmail = await User.findOne({ email: who.email });
    if (sameEmail) {
      if (sameEmail.googleSub) return backToApp(res, { auth_error: "conflict" });
      // Password sign-ups are not email-verified, so someone else could have registered this address first.
      // Google has now proven that THIS person owns it: link, and kill the old password and logins.
      await User.updateOne({ _id: sameEmail._id }, { $set: { googleSub: who.sub, passwordHash: null } });
      await Session.deleteMany({ userId: sameEmail._id });
      await startSession(res, sameEmail);
      return backToApp(res, { auth_notice: "linked" });
    }

    // 3. a new person: no account until they agree to the consent
    const token = randomBytes(32).toString("base64url");
    await PendingSignup.create({ tokenHash: sha256(token), googleSub: who.sub, email: who.email, expiresAt: new Date(Date.now() + 15 * 60 * 1000) });
    setCookie(res, PENDING_COOKIE, token, 900);
    return backToApp(res, { auth_notice: "consent" });
  } catch (err) {
    next(err);
  }
});

const pendingFor = async (req) => {
  const token = parseCookies(req.headers.cookie)[PENDING_COOKIE];
  if (!token) return null;
  const row = await PendingSignup.findOne({ tokenHash: sha256(token) });
  return row && row.expiresAt > new Date() ? row : null;
};

// The page asks: is someone waiting to finish signing up?
router.get("/auth/google/pending", async (req, res, next) => {
  try {
    const row = await pendingFor(req);
    if (!row) return res.status(404).json({ error: "Nothing to finish." });
    res.json({ email: row.email });
  } catch (err) { next(err); }
});

// Step 3 (new people only): they agreed, so now the account is created.
router.post("/auth/google/complete", async (req, res, next) => {
  try {
    if (!completeLimiter.take(req.ip).ok) return res.status(429).json({ error: "Too many attempts. Try again later." });
    const row = await pendingFor(req);
    if (!row) return res.status(410).json({ error: "That sign-in expired. Please try Continue with Google again." });
    const { acceptRecording, acceptAi } = req.body ?? {};
    if (acceptRecording !== true) return res.status(400).json({ error: "You need to agree to the recording of your practice to use the platform.", needsConsent: true });

    let user;
    try {
      user = await User.create({ email: row.email, googleSub: row.googleSub, learnerId: randomUUID(), consent: { recording: stamp(), ai: acceptAi === true ? stamp() : null } });
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ error: "An account with this email already exists. Try logging in." });
      throw err;
    }
    await ConsentEvent.create({ userId: user._id, kind: "recording", accepted: true, version: CONSENT_VERSION });
    if (acceptAi === true) await ConsentEvent.create({ userId: user._id, kind: "ai", accepted: true, version: CONSENT_VERSION });
    await PendingSignup.deleteOne({ _id: row._id });
    clearCookie(res, PENDING_COOKIE);
    await startSession(res, user);
    res.status(201).json({ user: publicUser(user) });
  } catch (err) { next(err); }
});

// They changed their mind: forget the pending sign-in (nothing was stored about them except this row).
router.post("/auth/google/cancel", async (req, res, next) => {
  try {
    const row = await pendingFor(req);
    if (row) await PendingSignup.deleteOne({ _id: row._id });
    clearCookie(res, PENDING_COOKIE);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
