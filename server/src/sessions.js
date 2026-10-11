// A "session" = a stretch of activity with no gap longer than 30 minutes. Every log row carries its sessionId, so
// later analysis can see time of day, session length, how long a learner was away (forgetting) and how often they return.
import { randomUUID } from "node:crypto";
import { LearnerActivity } from "./models/LearnerActivity.js";

export const SESSION_GAP_MS = 30 * 60 * 1000;

/** Marks activity now and returns the learner's current sessionId (starting a new session after a long gap). */
export async function touchSession(learnerId, now = new Date()) {
  const same = await LearnerActivity.findOneAndUpdate(
    { learnerId, lastAt: { $gte: new Date(now.getTime() - SESSION_GAP_MS) } },
    { $set: { lastAt: now } },
    { returnDocument: "after" }
  );
  if (same) return same.sessionId;
  const fresh = await LearnerActivity.findOneAndUpdate(
    { learnerId },
    { $set: { lastAt: now, sessionId: randomUUID(), sessionStartedAt: now }, $inc: { sessionCount: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  return fresh.sessionId;
}
