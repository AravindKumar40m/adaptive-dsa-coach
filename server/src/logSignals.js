// Gathers the extra signals stored with every Run/Submit (Logging v2). The database lookups live here;
// the calculations themselves are pure functions in codeSignals.js and errors.js.
import { approachSimilarity, codeStats } from "./codeSignals.js";
import { ProblemEvent } from "./models/ProblemEvent.js";
import { ReferenceSolution } from "./models/ReferenceSolution.js";
import { Submission } from "./models/Submission.js";

// reference solutions rarely change: keep them in memory for 10 minutes
const refCache = new Map();
async function referencesFor(problem, language) {
  const key = `${problem}:${language}`;
  const hit = refCache.get(key);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.refs;
  const refs = await ReferenceSolution.find({ problem, language }).select("approach code -_id").lean();
  refCache.set(key, { at: Date.now(), refs });
  return refs;
}

/** How and when the learner reached this problem: from a recommendation, the library, or directly. */
export async function openContext(learnerId, slug) {
  const opened = await ProblemEvent.findOne({ learnerId, problem: slug, kind: "opened" }).sort({ createdAt: -1 }).lean();
  return { openSource: opened?.value ?? null, recommendationId: opened?.recommendationId ?? null };
}

/**
 * @param {{learnerId, slug, language, code, problem, graded, tests}} p  tests = the TestCase rows that were run
 * @returns the fields to store on the Submission row (anything that fails to compute is simply left out)
 */
export async function collectSignals({ learnerId, slug, language, code, problem, graded, tests }) {
  const kindOf = new Map(tests.map((t) => [t.idx, t.kind]));
  const firstFail = graded.tests.find((t) => t.verdict !== "passed");
  const out = {
    perTest: graded.tests.map(({ idx, verdict }) => ({ idx, verdict, kind: kindOf.get(idx) })),
    firstFailKind: firstFail ? kindOf.get(firstFail.idx) : undefined,
    codeStats: codeStats(code, language, problem.signature?.name),
  };
  const [refs, ctx, runsBefore] = await Promise.all([
    referencesFor(slug, language).catch(() => []),
    openContext(learnerId, slug),
    Submission.countDocuments({ learnerId, problem: slug }),
  ]);
  const approach = approachSimilarity(code, language, refs);
  if (approach) out.approach = approach;
  return { ...out, ...ctx, runsOnProblemBefore: runsBefore };
}
