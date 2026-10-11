import mongoose from "mongoose";

// Operational timings, so the owner can answer "what failed, why, for whom, how often?" (see metrics.js).
// Kept 14 days, then deleted by MongoDB itself. `who` is a scrambled learner id, never the id or the email.
export const METRIC_KINDS = ["http", "judge0", "ai", "mongo"];
const schema = new mongoose.Schema(
  {
    kind: { type: String, enum: METRIC_KINDS, required: true },
    name: String, // http: "POST /api/submit" (the route pattern, no ids)  judge0: language id  ai: model  mongo: "ping"
    ms: Number,
    ok: Boolean,
    status: Number, // http status, or Judge0's own status id
    who: String,
    extra: mongoose.Schema.Types.Mixed, // judge0: { execSec, wallSec, overheadMs }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
schema.index({ createdAt: 1 }, { expireAfterSeconds: 14 * 24 * 3600 });
schema.index({ kind: 1, name: 1, createdAt: -1 });

export const MetricEvent = mongoose.model("MetricEvent", schema);
