// A local stand-in for Google's sign-in, for tests only. It enforces what the real one enforces: the exact registered
// redirect address, one-time codes, the client secret and the PKCE proof. It can also be told to misbehave (bad tokens)
// so the tests can check that our server rejects them. Control it from code (`fake.set(...)`) or over HTTP (`/__set?...`).
import { createHash, randomBytes } from "node:crypto";
import http from "node:http";

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

export async function startFakeGoogle({ clientId, clientSecret, redirectUri, port = 0 }) {
  const state = { identity: { sub: "sub-1", email: "someone@example.test", verified: true }, mode: "ok", codes: new Map(), tokenRequests: [], authorizeRequests: [] };
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://fake");
    const text = (code, body, type = "text/plain") => { res.statusCode = code; res.setHeader("content-type", type); res.end(body); };

    if (url.pathname === "/__set") { // test control
      for (const k of ["mode", "email", "sub"]) if (url.searchParams.has(k)) (k === "mode" ? state : state.identity)[k] = url.searchParams.get(k);
      if (url.searchParams.has("verified")) state.identity.verified = url.searchParams.get("verified") === "true";
      return text(200, JSON.stringify({ mode: state.mode, identity: state.identity }), "application/json");
    }

    if (url.pathname === "/authorize") {
      const q = url.searchParams;
      state.authorizeRequests.push(Object.fromEntries(q));
      if (q.get("client_id") !== clientId) return text(400, "invalid_client");
      if (q.get("redirect_uri") !== redirectUri) return text(400, "redirect_uri_mismatch");
      if (q.get("response_type") !== "code") return text(400, "unsupported_response_type");
      const back = new URL(redirectUri);
      if (state.mode === "deny") { back.searchParams.set("error", "access_denied"); back.searchParams.set("state", q.get("state")); res.statusCode = 302; res.setHeader("location", back.toString()); return res.end(); }
      const code = randomBytes(12).toString("hex");
      state.codes.set(code, { nonce: q.get("nonce"), challenge: q.get("code_challenge"), method: q.get("code_challenge_method"), identity: { ...state.identity } });
      back.searchParams.set("code", code);
      back.searchParams.set("state", q.get("state"));
      res.statusCode = 302; res.setHeader("location", back.toString());
      return res.end();
    }

    if (url.pathname === "/token" && req.method === "POST") {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      const p = new URLSearchParams(raw);
      state.tokenRequests.push(Object.fromEntries(p));
      const fail = (error) => text(400, JSON.stringify({ error }), "application/json");
      if (p.get("client_id") !== clientId || p.get("client_secret") !== clientSecret) return fail("invalid_client");
      if (p.get("redirect_uri") !== redirectUri || p.get("grant_type") !== "authorization_code") return fail("invalid_request");
      const entry = state.codes.get(p.get("code"));
      state.codes.delete(p.get("code")); // a code works once
      if (!entry) return fail("invalid_grant");
      const proof = createHash("sha256").update(p.get("code_verifier") ?? "").digest("base64url");
      if (entry.method !== "S256" || proof !== entry.challenge) return fail("invalid_grant");
      const now = Math.floor(Date.now() / 1000);
      const claims = {
        iss: "https://accounts.google.com", aud: clientId, sub: entry.identity.sub, email: entry.identity.email,
        email_verified: entry.identity.verified, nonce: entry.nonce, iat: now, exp: now + 3600,
      };
      if (state.mode === "bad-aud") claims.aud = "someone-elses-app";
      if (state.mode === "bad-iss") claims.iss = "https://evil.example";
      if (state.mode === "bad-nonce") claims.nonce = "not-the-nonce";
      if (state.mode === "expired") claims.exp = now - 60;
      const idToken = `${b64({ alg: "RS256", typ: "JWT" })}.${b64(claims)}.fake-signature`;
      return text(200, JSON.stringify({ access_token: "ya29.fake", token_type: "Bearer", expires_in: 3600, id_token: idToken }), "application/json");
    }
    text(404, "not found");
  });
  await new Promise((r) => server.listen(port, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    base, state, authUrl: `${base}/authorize`, tokenUrl: `${base}/token`,
    set(patch) { Object.assign(state, patch.mode ? { mode: patch.mode } : {}); if (patch.identity) Object.assign(state.identity, patch.identity); },
    close: () => new Promise((r) => server.close(r)),
  };
}
