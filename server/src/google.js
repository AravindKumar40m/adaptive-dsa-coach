// Google sign-in, "authorization code" flow with PKCE. Everything about talking to Google lives here.
//   1. we send the browser to Google with a random state, nonce and a PKCE challenge
//   2. Google sends it back with a one-time code
//   3. we exchange the code (server to server, using the client secret and the PKCE verifier) for an ID token
//   4. we check the token's claims and use Google's permanent user id ("sub") and the verified email
import { createHash, randomBytes } from "node:crypto";
import { config } from "./config.js";

export const googleEnabled = () => Boolean(config.googleClientId && config.googleClientSecret);

const b64url = (buf) => Buffer.from(buf).toString("base64url");
const sha256b64url = (s) => createHash("sha256").update(s).digest("base64url");

/** Fresh secrets for one sign-in attempt. They are kept in a short-lived HttpOnly cookie, never given to the page. */
export function newAttempt() {
  return { state: b64url(randomBytes(24)), nonce: b64url(randomBytes(24)), verifier: b64url(randomBytes(32)) };
}

export function authorizeUrl({ state, nonce, verifier }) {
  const url = new URL(config.googleAuthUrl);
  url.search = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: config.googleRedirectUri,
    response_type: "code",
    scope: "openid email", // the least we need: who they are and their verified email (no name, no photo)
    state, nonce,
    code_challenge: sha256b64url(verifier), code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return url.toString();
}

/** Thrown for anything wrong with the sign-in; `code` is a short word the page turns into a message. */
export class GoogleAuthError extends Error {
  constructor(code, detail) { super(detail ?? code); this.code = code; }
}

const ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);

/** Checks the claims of an ID token received straight from Google's token endpoint over HTTPS. */
export function checkClaims(claims, { nonce, now = Date.now() }) {
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!ISSUERS.has(claims.iss)) throw new GoogleAuthError("failed", "wrong issuer");
  if (!aud.includes(config.googleClientId)) throw new GoogleAuthError("failed", "token is for another app");
  if (typeof claims.exp !== "number" || claims.exp * 1000 < now) throw new GoogleAuthError("failed", "token expired");
  if (claims.nonce !== nonce) throw new GoogleAuthError("failed", "nonce mismatch");
  if (typeof claims.sub !== "string" || !claims.sub) throw new GoogleAuthError("failed", "no subject");
  if (typeof claims.email !== "string" || !claims.email.includes("@")) throw new GoogleAuthError("failed", "no email");
  if (claims.email_verified !== true && claims.email_verified !== "true") throw new GoogleAuthError("unverified");
  return { sub: claims.sub, email: claims.email.trim().toLowerCase() };
}

/** Trades the one-time code for the person's identity. */
export async function exchangeCode({ code, verifier, nonce }) {
  let res;
  try {
    res = await fetch(config.googleTokenUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, code_verifier: verifier, grant_type: "authorization_code",
        client_id: config.googleClientId, client_secret: config.googleClientSecret, redirect_uri: config.googleRedirectUri,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new GoogleAuthError("unavailable");
  }
  if (!res.ok) throw new GoogleAuthError("failed", `token endpoint answered ${res.status}`);
  const body = await res.json().catch(() => ({}));
  const parts = String(body.id_token ?? "").split(".");
  if (parts.length !== 3) throw new GoogleAuthError("failed", "no id_token");
  let claims;
  try { claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")); } catch { throw new GoogleAuthError("failed", "unreadable id_token"); }
  // No signature check on purpose: Google's own guidance allows this when the token comes directly from its token
  // endpoint over TLS together with our client secret. Never accept an ID token that arrives from the browser.
  return checkClaims(claims, { nonce });
}
