import { Router } from "express";
import { Concept } from "../models/Concept.js";
import { Problem } from "../models/Problem.js";
import { LANGUAGES } from "../languages.js";
import { starterCode } from "../harness.js";

const router = Router();

// Learner-facing views only: no hidden tests, no reference solutions, no hints (hints come via the hint ladder later).
const LIST_FIELDS = "slug title concept difficulty rating -_id";
const DETAIL_HIDE = "-_id -__v -hints";

router.get("/concepts", async (_req, res) => {
  res.json(await Concept.find().sort({ order: 1 }).select("-_id -__v").lean());
});

router.get("/problems", async (req, res) => {
  const filter = req.query.concept ? { concept: String(req.query.concept) } : {};
  res.json(await Problem.find(filter).sort({ rating: 1, slug: 1 }).select(LIST_FIELDS).lean());
});

router.get("/problems/:slug", async (req, res) => {
  const problem = await Problem.findOne({ slug: req.params.slug }).select(DETAIL_HIDE).lean();
  if (!problem) return res.status(404).json({ error: "problem not found" });
  const starters = Object.fromEntries(Object.keys(LANGUAGES).map((l) => [l, starterCode(l, problem.signature)]));
  res.json({ ...problem, starters });
});

export default router;
