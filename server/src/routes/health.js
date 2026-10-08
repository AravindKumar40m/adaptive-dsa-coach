import { Router } from "express";
import { config } from "../config.js";
import { dbConnected } from "../db.js";

const router = Router();

// Is the code-running sandbox (Judge0) reachable?
async function judge0Up() {
  try {
    const res = await fetch(`${config.judge0Url}/about`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

router.get("/", async (_req, res) => {
  const status = { api: true, mongo: dbConnected(), judge0: await judge0Up() };
  res.status(status.mongo && status.judge0 ? 200 : 503).json(status);
});

export default router;
