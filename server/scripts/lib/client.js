// Helper for the HTTP tests: creates a temporary account (email ends in @example.test) and talks to the API as that person.
// Every user it makes must be removed with user.deleteAccount() (the tests do this in a finally block);
// scripts/cleanup-test-data.js removes any left behind by a crashed test.
import { randomBytes } from "node:crypto";

export async function newUser(base, { ai = false, recording = true } = {}) {
  const tag = randomBytes(5).toString("hex");
  const email = `test-${tag}@example.test`;
  const password = `test-password-${tag}`;
  const res = await fetch(`${base}/auth/signup`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, acceptRecording: recording, acceptAi: ai }),
  });
  const json = await res.json();
  if (res.status !== 201) throw new Error(`could not create a test account: ${res.status} ${JSON.stringify(json)}`);
  return makeClient(base, { email, password, learnerId: json.user.learnerId, cookie: res.headers.getSetCookie()[0].split(";")[0] });
}

export function makeClient(base, { email, password, learnerId, cookie }) {
  const user = { email, password, learnerId, cookie };
  const call = async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: { ...(body === undefined ? {} : { "content-type": "application/json" }), ...(user.cookie ? { cookie: user.cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let json = null;
    try { json = await res.json(); } catch { /* no body */ }
    return { status: res.status, json, headers: res.headers };
  };
  user.get = (path) => call("GET", path);
  user.post = (path, body) => call("POST", path, body ?? {});
  user.del = (path, body) => call("DELETE", path, body);
  user.deleteAccount = () => call("DELETE", "/auth/account", { password: user.password });
  return user;
}
