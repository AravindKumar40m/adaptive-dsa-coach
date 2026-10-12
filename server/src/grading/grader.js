// Runs learner code against tests in Judge0 and turns the raw output into a per-test verdict.
// Grading only: the routes log submissions. The one exception is a fire-and-forget timing of the Judge0 call (metrics.js).
import { randomBytes } from "node:crypto";
import { config } from "../config.js";
import { LANGUAGES, CPU_TIME_LIMIT_SEC } from "./languages.js";
import { buildSource, encodeInput, encodeValue, resultPattern } from "./harness.js";
import { classifyRun, effectiveSignal } from "./errors.js";
import { recordMetric } from "../core/metrics.js";

const b64 = (s) => Buffer.from(s, "utf8").toString("base64");
const unb64 = (s) => (s ? Buffer.from(s, "base64").toString("utf8") : "");
const clip = (s, n) => (s.length > n ? s.slice(0, n) + "\n...(truncated)" : s);

/** One Judge0 run. `limits` (optional) overrides memoryKb / cpuSec / wallSec: the complexity analyzer needs more room than a test run. */
export async function callJudge0(lang, source, stdin, learnerId, limits = {}) {
  // Judge0 leaves exit_code, exit_signal and wall_time out unless they are asked for by name
  const fields = "stdout,stderr,compile_output,message,status,time,wall_time,memory,exit_code,exit_signal,token";
  const started = process.hrtime.bigint();
  const waited = () => Number(process.hrtime.bigint() - started) / 1e6;
  let res;
  try {
    res = await fetch(`${config.judge0Url}/submissions?base64_encoded=true&wait=true&fields=${fields}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        language_id: lang.judge0Id,
        source_code: b64(source),
        stdin: b64(stdin),
        memory_limit: limits.memoryKb ?? lang.memoryKb,
        ...(lang.compilerOptions ? { compiler_options: lang.compilerOptions } : {}), // Java: cap javac's JVM (see languages.js)
        cpu_time_limit: limits.cpuSec ?? CPU_TIME_LIMIT_SEC,
        wall_time_limit: limits.wallSec ?? 10,
      }),
      signal: AbortSignal.timeout(60000),
    });
  } catch (err) {
    recordMetric({ kind: "judge0", name: `lang${lang.judge0Id}`, ms: waited(), ok: false, learnerId });
    throw err;
  }
  if (!res.ok) {
    recordMetric({ kind: "judge0", name: `lang${lang.judge0Id}`, ms: waited(), ok: false, status: res.status, learnerId });
    throw new Error(`Judge0 returned HTTP ${res.status}`);
  }
  const raw = await res.json();
  // overhead = how long we waited minus how long the program itself ran = queueing + start-up inside Judge0
  const wallSec = Number(raw.wall_time) || 0;
  recordMetric({
    kind: "judge0", name: `lang${lang.judge0Id}`, ms: waited(), ok: raw.status?.id !== 13, status: raw.status?.id, learnerId,
    extra: { execSec: Number(raw.time) || 0, wallSec, overheadMs: Math.max(0, Math.round(waited() - wallSec * 1000)) },
  });
  return raw;
}

/**
 * @returns {{verdict, compileOutput, tests:[{idx, verdict, actual}], stdout, stderr, timeSec, memoryKb}}
 * verdict: accepted | wrong_answer | runtime_error | time_limit | compile_error | internal_error
 * per-test verdict: passed | wrong_answer | runtime_error | time_limit | not_run
 */
async function gradeInner({ language, code, signature, tests, learnerId }) {
  const lang = LANGUAGES[language];
  if (!lang) throw new Error(`unsupported language: ${language}`);
  const nonce = randomBytes(6).toString("hex");
  const { source, lineOffset } = buildSource(language, code, signature, nonce);
  const raw = await callJudge0(lang, source, encodeInput(signature, tests), learnerId);
  // Python gets the node classes on extra lines before the learner's code: make error line numbers match their editor
  const fixLines = (text) => (lineOffset ? text.replace(/(script\.py", line )(\d+)/g, (m, a, n) => (Number(n) > lineOffset ? a + (Number(n) - lineOffset) : m)) : text);

  const statusId = raw.status?.id;
  const stdoutAll = unb64(raw.stdout);
  const stderr = fixLines(clip(unb64(raw.stderr), 1500));
  // The learner's function runs once per test, so their prints repeat. Show the output of one test only.
  const segments = stdoutAll.split(resultPattern(nonce)).filter((_, i) => i % 3 === 0); // text before each result marker
  const base = {
    stdout: "",
    stderr,
    timeSec: Number(raw.time) || 0,
    memoryKb: raw.memory ?? 0,
    // Judge0's own signals, kept for the log (the learner sees only the verdict)
    statusId,
    exitCode: raw.exit_code ?? null,
    exitSignal: effectiveSignal(raw.exit_signal, raw.exit_code), // 11 = segfault, 8 = divide by zero ...
    wallTimeSec: Number(raw.wall_time) || 0,
  };

  if (statusId === 6) {
    return { ...base, verdict: "compile_error", compileOutput: fixLines(clip(unb64(raw.compile_output), 3000)), tests: [] };
  }
  // Python and Node have no compile step: report a syntax error as a compile error too.
  if (
    (language === "python" || language === "javascript") &&
    /(SyntaxError|IndentationError|TabError)/.test(stderr) &&
    !resultPattern(nonce).test(stdoutAll)
  ) {
    return { ...base, verdict: "compile_error", compileOutput: stderr, tests: [] };
  }
  if (statusId === 13 || statusId === 14) {
    return { ...base, verdict: "internal_error", compileOutput: clip(raw.message ?? "", 500), tests: [] };
  }

  const actual = new Map();
  for (const m of stdoutAll.matchAll(resultPattern(nonce))) actual.set(Number(m[1]), m[2]);

  // The program may have died part-way (crash or time limit). The first test with no result takes the blame.
  const diedAs = statusId === 5 ? "time_limit" : "runtime_error";
  let blamed = false;
  const results = tests.map((t, i) => {
    if (!actual.has(i)) {
      if (!blamed) {
        blamed = true;
        return { idx: t.idx, verdict: diedAs, actual: null };
      }
      return { idx: t.idx, verdict: "not_run", actual: null };
    }
    const out = actual.get(i);
    if (out.startsWith("ERR:")) return { idx: t.idx, verdict: "runtime_error", actual: out };
    return { idx: t.idx, verdict: out === encodeValue(signature.returns, t.expected) ? "passed" : "wrong_answer", actual: out };
  });

  const firstBad = results.find((r) => r.verdict !== "passed");
  const focus = firstBad ? results.indexOf(firstBad) : 0;
  base.stdout = clip((segments[focus] ?? "").trim(), 2000);
  const verdict = firstBad ? firstBad.verdict : "accepted";
  return { ...base, verdict, compileOutput: "", tests: results };
}

/** Grades the code and also says what KIND of mistake a crash was (errorName / errorFamily). */
export async function gradeCode(args) {
  const out = await gradeInner(args);
  return { ...out, ...classifyRun(out) };
}
