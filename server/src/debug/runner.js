// Runs one traced Python run in Judge0 and turns its output into a trace the browser can replay.
// parseTrace is pure (tested without services); runTrace calls Judge0 through the same helper the grader uses.
import { randomBytes } from "node:crypto";
import { inflateSync } from "node:zlib";
import { LANGUAGES } from "../grading/languages.js";
import { callJudge0 } from "../grading/grader.js";
import { MAX_STEPS, MAX_TRACE_BYTES, buildDebugProgram } from "./program.js";

// parameter types the traced program can take today (plain JSON values); linked lists and trees come later
export const TRACEABLE_TYPES = new Set(["int", "bool", "string", "int[]", "int[][]"]);
export const canTrace = (signature) => Array.isArray(signature?.params) && signature.params.every((p) => TRACEABLE_TYPES.has(p.type));

const unb64 = (s) => (s ? Buffer.from(s, "base64").toString("utf8") : "");

/**
 * Finds the marked line in the program's stdout and decodes it. Anything else the learner printed is ignored (the run's
 * own output is captured inside the program), and a marker with the wrong nonce does not count.
 * @returns {{ok:true, trace:object}|{ok:false, reason:string}}
 */
export function parseTrace(stdout, nonce) {
  const m = new RegExp(`@@D${nonce}@@([A-Za-z0-9+/=]+)@@`).exec(stdout ?? "");
  if (!m) return { ok: false, reason: "no_trace" };
  let doc;
  try {
    const raw = inflateSync(Buffer.from(m[1], "base64"), { maxOutputLength: MAX_TRACE_BYTES * 2 });
    doc = JSON.parse(raw.toString("utf8"));
  } catch {
    return { ok: false, reason: "bad_trace" };
  }
  if (!doc || !Array.isArray(doc.steps) || !Array.isArray(doc.calls)) return { ok: false, reason: "bad_trace" };
  doc.steps = doc.steps.slice(0, MAX_STEPS);
  return { ok: true, trace: doc };
}

/**
 * Runs `code` once with tracing on, with the given arguments, and returns the trace.
 * @returns {Promise<{ok:true, trace:object, timeSec:number}|{ok:false, reason:string, message?:string}>}
 */
export async function runTrace({ code, signature, args, learnerId }) {
  if (!canTrace(signature)) return { ok: false, reason: "unsupported" };
  const nonce = randomBytes(12).toString("hex");
  const program = buildDebugProgram({ code, functionName: signature.name, args, nonce });
  const raw = await callJudge0(LANGUAGES.python, program, "", learnerId, { cpuSec: 6, wallSec: 12 });
  const status = raw.status?.id;
  const parsed = parseTrace(unb64(raw.stdout), nonce);
  if (parsed.ok) return { ok: true, trace: parsed.trace, timeSec: Number(raw.time) || 0 };
  // no trace: a syntax error stops the program before it can print anything (it is compiled inside the program, so the message is in stderr)
  const stderr = unb64(raw.stderr);
  if (status === 5) return { ok: false, reason: "time_limit" };
  return { ok: false, reason: parsed.reason, message: stderr.split("\n").filter(Boolean).slice(-1)[0]?.slice(0, 200) };
}
