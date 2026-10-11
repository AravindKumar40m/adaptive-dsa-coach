import express from "express";
import { config } from "./config.js";
import { connectDb } from "./core/db.js";
import { guardLearner, loadUser, sameOriginOnly } from "./auth/auth.js";
import health from "./routes/health.js";
import auth from "./routes/auth.js";
import google from "./routes/google.js";
import content from "./routes/content.js";
import run from "./routes/run.js";
import skills from "./routes/skills.js";
import hints from "./routes/hints.js";
import events from "./routes/events.js";
import placement from "./routes/placement.js";
import snapshots from "./routes/snapshots.js";
import { startMongoPing, timeRequests } from "./core/metrics.js";

const app = express();
// No open CORS: the page and the API live on one address (the dev proxy / the production server), and the session
// cookie is HttpOnly + SameSite=Lax. sameOriginOnly refuses browser requests that come from other websites.
app.use(express.json({ limit: "200kb" })); // learner code is small; cap request size
app.use(loadUser); // req.user = the logged-in person, or null
app.use(timeRequests); // observability: how long each route takes (metrics.js)
app.use(sameOriginOnly);

app.use("/api/health", health);
app.use("/api", auth);
app.use("/api", google);
app.use("/api", content); // problems and concepts are public

// Everything about one learner needs a login, only their own id, and (for anything that records) current consent.
app.use(["/api/run", "/api/submit", "/api/hint", "/api/feedback", "/api/problem-event", "/api/placement", "/api/snapshot", "/api/learners"], guardLearner);
app.use("/api", run);
app.use("/api", skills);
app.use("/api", hints);
app.use("/api", events);
app.use("/api", placement);
app.use("/api", snapshots);

// last-resort error handler: never leak stack traces to the browser
app.use((err, _req, res, _next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "The request body is not valid JSON." });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "The request is too large." });
  console.error(err);
  res.status(500).json({ error: "server error" });
});

// Start the API even if MongoDB is down, so /api/health can report what is wrong.
connectDb().catch((err) => console.error("MongoDB not connected:", err.message));
startMongoPing();
app.listen(config.port, () => console.log(`API on http://localhost:${config.port}`));
