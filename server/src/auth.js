// Passwords, sessions and the middleware that protects the learner routes.
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { config } from "./config.js";
import { CONSENT_VERSION } from "./consent.js";
import { Session } from "./models/Session.js";
import { User } from "./models/User.js";

const scryptAsync = promisify(scrypt);
const N = 16384, R = 8, P = 1, KEYLEN = 32; // scrypt cost settings (OWASP minimum for scrypt)
const MAXMEM = 64 * 1024 * 1024;

// ---------------------------------------------------------------- passwords
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, n, r, p, salt, hash] = String(stored).split("$");
  if (scheme !== "scrypt") return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await scryptAsync(password, Buffer.from(salt, "base64"), expected.length, { N: Number(n), r: Number(r), p: Number(p), maxmem: MAXMEM });
  return timingSafeEqual(actual, expected);
}

// Used when the email does not exist, so a wrong email takes as long as a wrong password (no account guessing by timing).
let dummyHash = null;
export async function burnPasswordTime(password) {
  dummyHash ??= await hashPassword("not-a-real-password");
  await verifyPassword(password, dummyHash);
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 10;

// ---------------------------------------------------------------- sessions and cookies
export const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const COOKIE = "session";

export function parseCookies(header) {
  const out = {};
  for (const part of String(header ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export async function startSession(res, user) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + config.sessionDays * 24 * 3600 * 1000);
  await Session.create({ tokenHash: sha256(token), userId: user._id, expiresAt });
  const flags = ["HttpOnly", "SameSite=Lax", "Path=/", `Max-Age=${config.sessionDays * 24 * 3600}`];
  if (config.cookieSecure) flags.push("Secure");
  res.append("Set-Cookie", `${COOKIE}=${token}; ${flags.join("; ")}`); // append: other cookies may be set in the same answer
}

export async function endSession(req, res) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (token) await Session.deleteOne({ tokenHash: sha256(token) });
  res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${config.cookieSecure ? "; Secure" : ""}`);
}

/** Puts req.user (or null) on every request, based on the session cookie. */
export async function loadUser(req, _res, next) {
  req.user = null;
  try {
    const token = parseCookies(req.headers.cookie)[COOKIE];
    if (token) {
      const session = await Session.findOne({ tokenHash: sha256(token) }).lean();
      if (session && session.expiresAt > new Date()) req.user = await User.findById(session.userId);
    }
    next();
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- what the learner agreed to
export const recordingConsentCurrent = (user) => user.consent?.recording?.version === CONSENT_VERSION;
export const aiConsentCurrent = (user) => user.consent?.ai?.version === CONSENT_VERSION;

export function publicUser(user) {
  return {
    email: user.email,
    learnerId: user.learnerId,
    hasPassword: Boolean(user.passwordHash), // false = Google-only account
    google: Boolean(user.googleSub),
    consentCurrent: recordingConsentCurrent(user), // false = must agree (again) before anything is recorded
    aiFeedback: aiConsentCurrent(user),
    createdAt: user.createdAt,
  };
}

// ---------------------------------------------------------------- middleware
/** Rejects browser requests that come from another website (a second defence next to SameSite cookies). */
export function sameOriginOnly(req, res, next) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return next();
  const origin = req.headers.origin; // absent for non-browser callers such as our tests
  if (origin) {
    let host = "";
    try { host = new URL(origin).host; } catch { /* invalid origin: falls through to the refusal below */ }
    if (host !== req.headers.host && !config.allowedOrigins.includes(origin)) {
      return res.status(403).json({ error: "Requests from other websites are not allowed." });
    }
  }
  next();
}

/**
 * Guard for every route that is about one learner: must be logged in, may only touch their own learner id,
 * and anything that records data (POST) needs the CURRENT recording consent.
 */
export function guardLearner(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Please sign in.", needsLogin: true });
  const mine = req.user.learnerId;
  const fromPath = req.baseUrl.endsWith("/learners") ? req.path.split("/")[1] : undefined;
  for (const claimed of [fromPath, req.body?.learnerId]) {
    if (claimed !== undefined && claimed !== mine) return res.status(403).json({ error: "That is not your account." });
  }
  if (req.body && typeof req.body === "object") req.body.learnerId = mine; // the session decides who you are
  if (req.method === "POST" && !recordingConsentCurrent(req.user)) {
    return res.status(403).json({ error: "Please agree to the recording of your practice first.", needsConsent: true });
  }
  next();
}
