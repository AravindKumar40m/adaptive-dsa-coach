// Runs learner code against tests in Judge0 and turns the raw output into a per-test verdict.
// Pure grading: no database, no logging (the routes do that).
import { randomBytes } from "node:crypto";
import { config } from "./config.js";
import { LANGUAGES, CPU_TIME_LIMIT_SEC } from "./languages.js";
import { buildSource, encodeInput, encodeValue, resultPattern } from "./harness.js";

const b64 = (s) => Buffer.from(s, "utf8").toString("base64");
const unb64 = (s) => (s ? Buffer.from(s, "base64").toString("utf8") : "");
const clip = (s, n) => (s.length > n ? s.slice(0, n) + "\n...(truncated)" : s);

async function callJudge0(lang, source, stdin) {
  const res = await fetch(`${config.judge0Url}/submissions?base64_encoded=true&wait=true`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      language_id: lang.judge0Id,
      source_code: b64(source),
      stdin: b64(stdin),
      memory_limit: lang.memoryKb,
      cpu_time_limit: CPU_TIME_LIMIT_SEC,
      wall_time_limit: 10,
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`Judge0 returned HTTP ${res.status}`);
  return res.json();
}

/**
 * @returns {{verdict, compileOutput, tests:[{idx, verdict, actual}], stdout, stderr, timeSec, memoryKb}}
 * verdict: accepted | wrong_answer | runtime_error | time_limit | compile_error | internal_error
 * per-test verdict: passed | wrong_answer | runtime_error | time_limit | not_run
 */
export async function gradeCode({ language, code, signature, tests }) {
  const lang = LANGUAGES[language];
  if (!lang) throw new Error(`unsupported language: ${language}`);
  const nonce = randomBytes(6).toString("hex");
  const { source, lineOffset } = buildSource(language, code, signature, nonce);
  const raw = await callJudge0(lang, source, encodeInput(signature, tests));
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
