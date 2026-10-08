import express from "express";
import { config } from "./config.js";
import { connectDb } from "./db.js";
import { guardLearner, loadUser, sameOriginOnly } from "./auth.js";
import health from "./routes/health.js";
import auth from "./routes/auth.js";
import google from "./routes/google.js";
import content from "./routes/content.js";
import run from "./routes/run.js";
import skills from "./routes/skills.js";
import hints from "./routes/hints.js";

const app = express();
// No open CORS: the page and the API live on one address (the dev proxy / the production server), and the session
// cookie is HttpOnly + SameSite=Lax. sameOriginOnly refuses browser requests that come from other websites.
app.use(express.json({ limit: "200kb" })); // learner code is small; cap request size
app.use(loadUser); // req.user = the logged-in person, or null
app.use(sameOriginOnly);

app.use("/api/health", health);
app.use("/api", auth);
app.use("/api", google);
app.use("/api", content); // problems and concepts are public

// Everything about one learner needs a login, only their own id, and (for anything that records) current consent.
app.use(["/api/run", "/api/submit", "/api/hint", "/api/feedback", "/api/learners"], guardLearner);
app.use("/api", run);
app.use("/api", skills);
app.use("/api", hints);

// last-resort error handler: never leak stack traces to the browser
app.use((err, _req, res, _next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "The request body is not valid JSON." });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "The request is too large." });
  console.error(err);
  res.status(500).json({ error: "server error" });
});

// Start the API even if MongoDB is down, so /api/health can report what is wrong.
connectDb().catch((err) => console.error("MongoDB not connected:", err.message));
app.listen(config.port, () => console.log(`API on http://localhost:${config.port}`));
