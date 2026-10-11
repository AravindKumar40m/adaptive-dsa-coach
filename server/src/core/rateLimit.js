// Tiny in-memory limiter: at most `limit` calls per `windowMs` per key. Resets when the server restarts
// (fine for the MVP; a shared store is needed once several servers run).
export function makeLimiter(limit, windowMs = 3600 * 1000) {
  const calls = new Map();
  return {
    /** @returns {{ok: boolean, retryAfterSec?: number}} and records the call when ok */
    take(key, now = Date.now()) {
      const recent = (calls.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= limit) {
        calls.set(key, recent);
        return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - recent[0])) / 1000) };
      }
      recent.push(now);
      calls.set(key, recent);
      return { ok: true };
    },
    reset() { calls.clear(); },
  };
}
