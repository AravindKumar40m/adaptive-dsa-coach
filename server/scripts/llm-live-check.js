// Calls the REAL Claude API once to see what the AI tutor actually says (costs a fraction of a cent).
// Needs ANTHROPIC_API_KEY in ../.env. Without a key it only tells you how to set one up.
// Run: npm run llm:live
import { config } from "../src/config.js";
import { explainResult, llmConfigured, summarizeResult } from "../src/llm.js";

if (!llmConfigured()) {
  console.log("No ANTHROPIC_API_KEY found.\n1. Create a key at https://console.anthropic.com (Settings -> API keys).\n2. Put ANTHROPIC_API_KEY=sk-ant-... in the .env file in the project root (never commit it).\n3. Run this again.");
  process.exit(0);
}

const problem = {
  title: "Peak Altitude",
  statement: "A hiker starts a trail at altitude 0. changes[i] is the net altitude change over segment i. Return the highest altitude the hiker reaches at any point, including the starting altitude 0.",
  constraints: ["1 <= len(changes) <= 100000", "-1000 <= changes[i] <= 1000"],
  signature: { name: "peak_altitude", params: [{ name: "changes", type: "int[]" }], returns: "int" },
};
// A realistic beginner mistake: forgets that the starting altitude 0 counts.
const code = "def peak_altitude(changes):\n    best = changes[0]\n    height = 0\n    for c in changes:\n        height += c\n        best = max(best, height)\n    return best\n";
const summary = summarizeResult({
  verdict: "wrong_answer", passed: 1, total: 2,
  tests: [
    { visible: true, verdict: "wrong_answer", args: [[-3, -2]], expected: 0, actual: -3 },
    { visible: true, verdict: "passed", args: [[-5, 1, 5, 0, -7]], expected: 1, actual: 1 },
  ],
});

console.log(`Model: ${config.anthropicModel}\n`);
const started = Date.now();
const reply = await explainResult({ problem, language: "python", code, summary });
console.log(reply);
console.log(`\n--- ${Date.now() - started} ms, ${reply.split(/\s+/).length} words`);
const problems = [];
if (reply.includes("```")) problems.push("contains a code block");
if (reply.split(/\s+/).length > 160) problems.push("longer than expected");
if (/best\s*=\s*0|max\(0/.test(reply)) problems.push("may give away the fix directly (check by eye)");
console.log(problems.length ? `Review needed: ${problems.join("; ")}` : "Looks fine: no code block, short, does not paste the fix. Read it and judge if it is helpful for a beginner.");
