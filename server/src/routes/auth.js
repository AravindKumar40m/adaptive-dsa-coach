import { Router } from "express";
import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { EMAIL_PATTERN, MIN_PASSWORD, burnPasswordTime, endSession, hashPassword, publicUser, startSession, verifyPassword } from "../auth.js";
import { CONSENT_TEXT, CONSENT_VERSION } from "../consent.js";
import { eraseLearnerData } from "../erase.js";
import { makeLimiter } from "../rateLimit.js";
import { ConsentEvent } from "../models/ConsentEvent.js";
import { Session } from "../models/Session.js";
import { User } from "../models/User.js";

const router = Router();
const signupLimiter = makeLimiter(config.signupsPerHour, 3600 * 1000);
const loginLimiter = makeLimiter(config.loginAttemptsPer15Min, 15 * 60 * 1000);

const cleanEmail = (value) => String(value ?? "").trim().toLowerCase();
const tooMany = (res, wait) => res.status(429).json({ error: `Too many attempts. Try again in ${Math.max(1, Math.ceil(wait / 60))} minutes.` });
const stamp = () => ({ version: CONSENT_VERSION, at: new Date() });
const log = (user, kind, accepted) => ConsentEvent.create({ userId: user._id, kind, accepted, version: CONSENT_VERSION });

// The exact consent wording (the sign-up page shows this, so what is shown is what is stored by version).
router.get("/consent", (_req, res) => res.json(CONSENT_TEXT));

router.post("/auth/signup", async (req, res, next) => {
  try {
    const turn = signupLimiter.take(req.ip);
    if (!turn.ok) return tooMany(res, turn.retryAfterSec);
    const { password, acceptRecording, acceptAi } = req.body ?? {};
    const email = cleanEmail(req.body?.email);
    if (!EMAIL_PATTERN.test(email) || email.length > 254) return res.status(400).json({ error: "Please enter a valid email address." });
    if (typeof password !== "string" || password.length < MIN_PASSWORD || password.length > 128) {
      return res.status(400).json({ error: `Your password must have ${MIN_PASSWORD} to 128 characters.` });
    }
    const emailName = email.split("@")[0];
    if (emailName.length >= 4 && password.toLowerCase().includes(emailName)) {
      return res.status(400).json({ error: "Your password must not contain your email name." });
    }
    if (acceptRecording !== true) {
      return res.status(400).json({ error: "You need to agree to the recording of your practice to use the platform.", needsConsent: true });
    }
    if (await User.exists({ email })) return res.status(409).json({ error: "An account with this email already exists. Try logging in." });

    let user;
    try {
      user = await User.create({ email, passwordHash: await hashPassword(password), learnerId: randomUUID(), consent: { recording: stamp(), ai: acceptAi === true ? stamp() : null } });
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ error: "An account with this email already exists. Try logging in." });
      throw err;
    }
    await log(user, "recording", true);
    if (acceptAi === true) await log(user, "ai", true);
    await startSession(res, user);
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post("/auth/login", async (req, res, next) => {
  try {
    const email = cleanEmail(req.body?.email);
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const turn = loginLimiter.take(`${req.ip}|${email}`);
    if (!turn.ok) return tooMany(res, turn.retryAfterSec);
    const user = await User.findOne({ email });
    // same message and same work for "no such email" and "wrong password"
    // same message and same work for "no such email", "Google-only account" and "wrong password"
    const ok = user?.passwordHash ? await verifyPassword(password, user.passwordHash) : (await burnPasswordTime(password), false);
    if (!ok) return res.status(401).json({ error: "Wrong email or password." });
    await startSession(res, user);
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post("/auth/logout", async (req, res, next) => {
  try {
    await endSession(req, res);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/auth/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Please sign in.", needsLogin: true });
  res.json({ user: publicUser(req.user), consentVersion: CONSENT_VERSION });
});

// Agree to (or withdraw) the recording consent and/or the optional AI consent.
router.post("/auth/consent", async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Please sign in.", needsLogin: true });
    const { recording, aiFeedback } = req.body ?? {};
    const set = {};
    if (typeof recording === "boolean") { set["consent.recording"] = recording ? stamp() : null; await log(req.user, "recording", recording); }
    if (typeof aiFeedback === "boolean") { set["consent.ai"] = aiFeedback ? stamp() : null; await log(req.user, "ai", aiFeedback); }
    if (Object.keys(set).length === 0) return res.status(400).json({ error: "Nothing to change." });
    const user = await User.findByIdAndUpdate(req.user._id, { $set: set }, { returnDocument: "after" });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// Delete the account and everything recorded about it. Needs the password (a stolen session alone is not enough).
router.delete("/auth/account", async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Please sign in.", needsLogin: true });
    const turn = loginLimiter.take(`${req.ip}|${req.user.email}`);
    if (!turn.ok) return tooMany(res, turn.retryAfterSec);
    if (req.user.passwordHash) {
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      if (!(await verifyPassword(password, req.user.passwordHash))) return res.status(403).json({ error: "Wrong password." });
    } else if (cleanEmail(req.body?.confirmEmail) !== req.user.email) {
      // a Google-only account has no password: typing the email address is the confirmation
      return res.status(403).json({ error: "Type your email address exactly to confirm." });
    }
    const { deleted } = await eraseLearnerData(req.user.learnerId);
    await Session.deleteMany({ userId: req.user._id });
    await ConsentEvent.deleteMany({ userId: req.user._id });
    await User.deleteOne({ _id: req.user._id });
    await endSession(req, res);
    res.json({ ok: true, deleted });
  } catch (err) {
    next(err);
  }
});

export default router;
