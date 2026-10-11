// Which recommender decides for this learner. PICKER_POLICY: v1 (today's picker), v2 (recommender2.js), ab (half each).
// v2 needs the knowledge model's memory of the learner, which only exists while shadow mode (KT_SHADOW) is on, so without it everybody gets v1.
// The A/B split depends only on the learner id: the same person always gets the same recommender, on every server and after every restart.
import { createHash } from "node:crypto";
import { config } from "./config.js";

export function policyFor(learnerId, { policy = config.pickerPolicy, shadow = config.ktShadow } = {}) {
  if (!shadow || policy === "v1") return "v1";
  if (policy === "v2") return "v2";
  if (policy === "ab") return createHash("sha256").update(String(learnerId)).digest()[0] % 2 === 1 ? "v2" : "v1";
  return "v1";
}
