// One place for talking to the API. The login lives in an HttpOnly cookie the browser sends by itself, so no token is
// ever handled (or stored) by this code.
let onSessionLost = () => {};
export const setSessionLostHandler = (fn) => { onSessionLost = fn; };

export async function api(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? {} : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 0, data: { error: "Could not reach the server." } };
  }
  let data = null;
  try { data = await res.json(); } catch { /* empty or not JSON */ }
  // 401 on a learner route = the login ended (expired, or logged out in another tab): go back to the login screen
  if (res.status === 401 && data?.needsLogin && !path.startsWith("/auth/")) onSessionLost();
  return { ok: res.ok, status: res.status, data: data ?? {} };
}
