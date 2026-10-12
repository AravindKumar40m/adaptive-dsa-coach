// Runs one complexity analysis in Judge0: builds the timing program (program.js), runs it, reads the timings and gives
// them to analyze.js. No database here (the route stores the result).
import { randomBytes } from "node:crypto";
import { callJudge0 } from "../grading/grader.js";
import { LANGUAGES } from "../grading/languages.js";
import { analyze } from "./analyze.js";
import { buildComplexityProgram, parseMeasurements } from "./program.js";

// more room than a normal run: input generation plus several timed batches (the program itself stops growing after about 3-4 s)
const LIMITS = { memoryKb: 512_000, cpuSec: 9, wallSec: 14 };
const TIME_LIMIT_STATUS = 5; // Judge0: "Time Limit Exceeded"

/**
 * @param {{code:string, config:{make:string, sizes:number[], functionName:string, expected:string}, learnerId?:string}} a
 * @returns {Promise<{analysis:object, points:{n:number, ns:number, reps:number}[], error:object|null, judgeStatus:number, wallMs:number}>}
 */
export async function runComplexity({ code, config, learnerId }) {
  const nonce = randomBytes(6).toString("hex");
  const source = buildComplexityProgram({ code, config, nonce });
  const started = Date.now();
  const raw = await callJudge0(LANGUAGES.python, source, "", learnerId, LIMITS);
  const stdout = raw.stdout ? Buffer.from(raw.stdout, "base64").toString("utf8") : "";
  const { points, error } = parseMeasurements(stdout, nonce);
  const killed = raw.status?.id === TIME_LIMIT_STATUS;
  return {
    analysis: analyze({ points, expected: config.expected, error, killed }),
    points, error, judgeStatus: raw.status?.id ?? 0, wallMs: Date.now() - started,
  };
}
