// Times OUR OWN reference solutions (slow brute force, optional better, fast optimal) through the real complexity analyzer in Judge0
// and checks each gets the verdict it should:  optimal / better -> "matches",  brute -> "slow".  This is how the analyzer's
// thresholds and each problem's input sizes are calibrated: if a brute force does not look slow, or a fast solution does not
// look fast, the generator or the sizes for that problem are wrong.
//   npm run complexity:validate                       every configured problem, once
//   npm run complexity:validate -- --repeat 3         every run three times: also reports how stable the verdicts are
//   npm run complexity:validate -- peak-altitude,pair-count     only these problems
import mongoose from "mongoose";
import { runComplexity } from "../../src/complexity/run.js";
import { config } from "../../src/config.js";
import { ComplexityConfig } from "../../src/models/ComplexityConfig.js";
import { ReferenceSolution } from "../../src/models/ReferenceSolution.js";

const args = process.argv.slice(2);
const repeatAt = args.indexOf("--repeat");
const repeat = repeatAt >= 0 ? Math.max(1, Number(args[repeatAt + 1]) || 1) : 1;
const only = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--repeat")?.split(",");
const WANT = { optimal: "matches", better: "matches", brute: "slow" };

await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
const configs = await ComplexityConfig.find(only ? { problem: { $in: only } } : {}).sort({ problem: 1 }).lean();
if (configs.length === 0) { console.log("no complexity configs: run npm run content:complexity first"); process.exit(1); }

console.log(`${"problem".padEnd(20)} ${"approach".padEnd(8)} ${"want".padEnd(8)} ${"verdict".padEnd(9)} ${"measured".padEnd(22)} ${"exp".padStart(5)}  ${"up to n".padStart(8)} ${"time".padStart(6)}`);
let wrong = 0, runs = 0, unstable = 0;
for (const c of configs) {
  const refs = await ReferenceSolution.find({ problem: c.problem, language: "python" }).lean();
  for (const approach of ["brute", "better", "optimal"]) {
    const ref = refs.find((r) => r.approach === approach);
    if (!ref) continue;
    const verdicts = [];
    let last;
    for (let i = 0; i < repeat; i++) {
      last = await runComplexity({ code: ref.code, config: c });
      verdicts.push(last.analysis.verdict);
      runs++;
    }
    const a = last.analysis;
    const ok = verdicts.every((v) => v === WANT[approach]);
    const stable = new Set(verdicts).size === 1;
    if (!ok) wrong++;
    if (!stable) unstable++;
    console.log(`${c.problem.padEnd(20)} ${approach.padEnd(8)} ${WANT[approach].padEnd(8)} ${a.verdict.padEnd(9)} ${String(a.label).slice(0, 22).padEnd(22)} ${String(a.exponent ?? "-").padStart(5)}  ${String(a.measuredUpTo ?? "-").padStart(8)} ${(last.wallMs / 1000).toFixed(1).padStart(5)}s ${ok ? "ok" : "WRONG"}${repeat > 1 ? `  [${verdicts.join(",")}]` : ""}${a.verdict === "unclear" || a.verdict === "unmeasured" ? `  (${a.message.slice(0, 80)})` : ""}`);
  }
}
console.log(`\n${runs} analyses of ${configs.length} problems: ${wrong === 0 ? "every verdict is what it should be" : `${wrong} approach(es) got the wrong verdict`}${repeat > 1 ? `; ${unstable === 0 ? "every repeated run agreed" : `${unstable} approach(es) gave different verdicts on different runs`}` : ""}.`);
await mongoose.disconnect();
process.exit(wrong === 0 && unstable === 0 ? 0 : 1);
