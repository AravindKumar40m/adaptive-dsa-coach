// After Google sends the browser back, the address carries ?auth_error=... or ?auth_notice=... .
// Read it once, then remove it from the address bar so a refresh does not repeat the message.
export function consumeAuthQuery() {
  const params = new URLSearchParams(window.location.search);
  const out = { error: params.get("auth_error"), notice: params.get("auth_notice") };
  if (out.error || out.notice) window.history.replaceState({}, "", window.location.pathname + window.location.hash);
  return out;
}

export const GOOGLE_ERRORS = {
  cancelled: "Sign-in with Google was cancelled.",
  unverified: "Google says this email address is not verified, so we cannot use it.",
  conflict: "That email already belongs to a different Google account.",
  too_many: "Too many sign-in attempts. Please try again in a few minutes.",
  unavailable: "Could not reach Google. Please try again.",
  not_configured: "Google sign-in is not set up on this server.",
  failed: "Google sign-in did not work. Please try again.",
};
