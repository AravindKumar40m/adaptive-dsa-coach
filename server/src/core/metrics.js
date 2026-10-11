// Observability: how long things take and what failed, written to MongoDB (kept 14 days, see models/MetricEvent.js).
// A metrics problem must never break a learner's request: every write is fire-and-forget and swallows its own errors.
import { createHash } from "node:crypto";
import mongoose from "mongoose";
import { dbConnected } from "./db.js";
import { MetricEvent } from "../models/MetricEvent.js";

/** A scrambled learner id: lets us count "how many different people hit this error" without storing who. */
export const whoHash = (learnerId) => createHash("sha256").update(`metric:${learnerId}`).digest("hex").slice(0, 10);

export function recordMetric({ kind, name, ms, ok, status, learnerId, extra }) {
  if (!dbConnected()) return;
  MetricEvent.create({ kind, name, ms: Math.round(ms), ok, status, who: learnerId ? whoHash(learnerId) : undefined, extra }).catch(() => {});
}

/** Express middleware: times every API request. The name is the route pattern (e.g. "GET /api/learners/:learnerId/next"), never real ids. */
export function timeRequests(req, res, next) {
  const started = process.hrtime.bigint();
  res.on("finish", () => {
    if (req.originalUrl.startsWith("/api/health")) return; // the page polls it all the time
    // DELETE requests are "delete my data" / "delete my account": their own row would be written AFTER the erase and
    // outlive it, so deleting must leave no timing row behind
    if (req.method === "DELETE") return;
    const route = req.route?.path ? `${req.baseUrl}${req.route.path}` : "unmatched";
    recordMetric({
      kind: "http", name: `${req.method} ${route}`, ms: Number(process.hrtime.bigint() - started) / 1e6,
      ok: res.statusCode < 500, status: res.statusCode, learnerId: req.user?.learnerId,
    });
  });
  next();
}

/** Times an async call (the code runner, the AI, ...) and records it, whether it worked or threw. */
export async function timed({ kind, name, learnerId }, fn) {
  const started = process.hrtime.bigint();
  let ok = true;
  try {
    return await fn();
  } catch (err) {
    ok = false;
    throw err;
  } finally {
    recordMetric({ kind, name, ms: Number(process.hrtime.bigint() - started) / 1e6, ok, learnerId });
  }
}

/** Once a minute: how long does MongoDB take to answer a ping? */
export function startMongoPing(everyMs = 60_000) {
  const timer = setInterval(async () => {
    if (!dbConnected()) return;
    const started = process.hrtime.bigint();
    let ok = true;
    try { await mongoose.connection.db.admin().ping(); } catch { ok = false; }
    recordMetric({ kind: "mongo", name: "ping", ms: Number(process.hrtime.bigint() - started) / 1e6, ok });
  }, everyMs);
  timer.unref(); // never keeps the process alive
  return timer;
}
