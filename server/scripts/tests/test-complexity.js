// The complexity analyzer's maths and its Python program (server/src/complexity). No Judge0 or database needed:
// the program is also run with the local Python to prove the whole chain (program -> output -> parse -> verdict) works.
// Expected numbers are worked out by hand in the comments.   Run: npm run test:complexity
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { INSTANT_NS, analyze, describeExponent, fitLine } from "../../src/complexity/analyze.js";
import { buildComplexityProgram, parseMeasurements } from "../../src/complexity/program.js";

let failures = 0;
const check = (ok, label, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${label} ${detail}`); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// ---------------------------------------------------------------- the line fit
let f = fitLine([1, 2, 3, 4], [3, 5, 7, 9]);
check(near(f.slope, 2, 1e-9) && near(f.r2, 1, 1e-9), "fitLine: y = 2x + 1 gives slope 2 and r2 1");
check(fitLine([5, 5, 5], [1, 2, 3]).slope === 0, "fitLine: identical x values give slope 0, no crash");

// ---------------------------------------------------------------- synthetic timings
const doubling = (start, max) => { const s = []; for (let n = start; n < max; n *= 2) s.push(n); return [...s, max]; };
const series = (sizes, fn, noise = 0, rnd = () => 0) => sizes.map((n) => ({ n, ns: Math.max(1, Math.round(fn(n) * (1 + noise * rnd()))) }));
let seed = 12345; // a seeded random generator, so the noisy tests give the same result every time
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const BIG = doubling(256, 100000), MID = doubling(256, 4096);
const linear = series(BIG, (n) => 400 * n);                // 400 ns per element: 40 ms at n = 100,000
const nlogn = series(BIG, (n) => 30 * n * Math.log2(n));
const quad = series(MID, (n) => 2 * n * n);                // 33 ms at n = 4096
const cubic = series([16, 24, 32, 48, 64, 96, 128, 192, 256, 384], (n) => 0.05 * n ** 3);
const flat = series(BIG, () => 80_000);
let r = analyze({ points: linear, expected: "n" });
check(r.verdict === "matches" && near(r.exponent, 1, 0.01) && r.label === "n (or n log n)" && !r.exponential, "linear timings, expected n: matches, exponent 1.0", JSON.stringify([r.exponent, r.label]));
check(analyze({ points: linear, expected: "n^2" }).verdict === "matches", "linear timings, expected n²: matches (better than the usual)");
check(analyze({ points: linear, expected: "log n" }).verdict === "slow", "linear timings, expected log n: slow (1.0 is above 0.1 + 0.6)");
r = analyze({ points: nlogn, expected: "n log n" });
check(r.verdict === "matches" && r.exponent > 1.05 && r.exponent < 1.3, "n log n timings, expected n log n: matches, exponent about 1.1-1.2", `(${r.exponent})`);
check(analyze({ points: nlogn, expected: "n" }).verdict === "matches", "n log n timings, expected n: still matches (1.15 is within 1 + 0.35)");
r = analyze({ points: quad, expected: "n" });
check(r.verdict === "slow" && near(r.exponent, 2, 0.01) && r.label === "n²", "quadratic timings, expected n: slow, exponent 2.0, 'n²'", JSON.stringify([r.verdict, r.exponent, r.label]));
check(/100 times longer/.test(r.message) && /n²/.test(r.message) && /passed the tests/.test(r.message), "...and the message says 10x more input = about 100x longer", r.message);
check(analyze({ points: quad, expected: "n log n" }).verdict === "slow", "quadratic timings, expected n log n: slow (2.0 > 1.15 + 0.6)");
check(analyze({ points: quad, expected: "n^2" }).verdict === "matches", "quadratic timings, expected n²: matches");
r = analyze({ points: cubic, expected: "n^2" });
check(r.verdict === "slow" && near(r.exponent, 3, 0.01) && r.label === "n³" && !r.exponential, "cubic timings, expected n²: slow, exponent 3.0, 'n³', NOT mistaken for exponential", JSON.stringify([r.verdict, r.exponent, r.label, r.exponential]));
r = analyze({ points: flat, expected: "n" });
check(r.verdict === "matches" && r.exponent < 0.1 && r.label === "constant or log n", "constant timings (80 microseconds): matches, 'constant or log n'");
check(analyze({ points: flat, expected: "log n" }).verdict === "matches", "...and matches a log n expectation too");
r = analyze({ points: series(BIG, (n) => 800 + 150 * Math.log(n)), expected: "n" });
check(r.verdict === "matches" && r.label === "instant" && r.measuredUpTo === 100000, "a solution that always takes under 50 microseconds is 'instant': matches", r.message);

// exponential: 1.6 times slower for each +1 in n, from n = 12 to the point where one call passes 0.3 s
const expo = series([12, 14, 16, 18, 20, 22, 24, 26, 28], (n) => 1000 * 1.6 ** n);
r = analyze({ points: expo, expected: "n" });
check(r.verdict === "slow" && r.exponential && r.label === "exponential" && near(r.factor, 1.6, 0.05) && /exponentially/.test(r.message), "exponential timings, expected n: slow, detected as exponential, about 1.6x per step", JSON.stringify([r.verdict, r.exponential, r.factor]));
check(analyze({ points: expo, expected: "exp" }).verdict === "matches", "exponential timings, expected exp: matches");
check(!analyze({ points: quad, expected: "n" }).exponential && !analyze({ points: linear, expected: "n" }).exponential, "quadratic and linear timings are never called exponential");

// the case the real Judge0 run showed: sizes only 2 apart and a little noise must still be called exponential
const stairs = [[10, 101], [12, 348], [14, 1165], [16, 3968], [18, 13358], [20, 45684], [22, 170060], [24, 644151]].map(([n, us]) => ({ n, ns: us * 1000 }));
r = analyze({ points: stairs, expected: "n" });
check(r.exponential && r.label === "exponential" && r.verdict === "slow" && near(r.factor, 1.9, 0.15), "the real stair-ways brute-force timings (n = 10..24, measured in Judge0): exponential, slow, about 1.9x per step", JSON.stringify([r.label, r.factor]));
let expRight = 0;
for (let i = 0; i < 40; i++) if (analyze({ points: series([12, 14, 16, 18, 20, 22, 24, 26, 28], (n) => 1000 * 1.6 ** n, 0.25, rnd), expected: "n" }).exponential) expRight++;
check(expRight >= 39, "exponential timings with up to 25% noise are recognised in at least 39 of 40 runs", `(${expRight}/40)`);
let cubicWrong = 0;
for (let i = 0; i < 40; i++) if (analyze({ points: series([16, 24, 32, 48, 64, 96, 128, 192, 256, 384], (n) => 0.05 * n ** 3, 0.25, rnd), expected: "n^2" }).exponential) cubicWrong++;
check(cubicWrong === 0, "cubic timings with up to 25% noise are never called exponential (40 of 40 runs)", `(${cubicWrong} wrong)`);

// the tolerance edges (exact power laws, so the slope is exact)
const power = (s) => series(BIG, (n) => 2 * n ** s);
check(analyze({ points: power(1.34), expected: "n" }).verdict === "matches" && analyze({ points: power(1.36), expected: "n" }).verdict === "near", "expected n: 1.34 matches, 1.36 is near");
check(analyze({ points: power(1.59), expected: "n" }).verdict === "near" && analyze({ points: power(1.61), expected: "n" }).verdict === "slow", "expected n: 1.59 is near, 1.61 is slow");
check(describeExponent(0.1) === "constant or log n" && describeExponent(0.5) === "between log n and n" && describeExponent(1) === "n (or n log n)" && describeExponent(1.5) === "between n log n and n²" && describeExponent(2) === "n²" && describeExponent(3) === "n³" && describeExponent(4) === "worse than n³", "plain names for every exponent band");

// noise: 40 seeded runs of each class with up to 15% random slowness on every point must keep the same label
const classes =[["linear", (n) => 400 * n, BIG, "n", "matches"], ["quadratic", (n) => 2 * n * n, MID, "n", "slow"], ["n log n", (n) => 30 * n * Math.log2(n), BIG, "n log n", "matches"], ["cubic", (n) => 0.05 * n ** 3, [16, 24, 32, 48, 64, 96, 128, 192, 256, 384], "n^2", "slow"]];
for (const [name, fn, sizes, expected, want] of classes) {
  let right = 0;
  for (let i = 0; i < 40; i++) if (analyze({ points: series(sizes, fn, 0.15, rnd), expected }).verdict === want) right++;
  check(right === 40, `${name}: 40 of 40 noisy runs (up to 15% slower) get the verdict '${want}'`, `(${right}/40)`);
}
// wild noise must never crash or claim a confident wrong verdict silently: it may only say "unclear" or stay correct
let wild = 0;
for (let i = 0; i < 40; i++) { const v = analyze({ points: series(MID, (n) => 2 * n * n, 4, rnd), expected: "n" }).verdict; if (["slow", "unclear", "near"].includes(v)) wild++; }
check(wild === 40, "quadratic timings with 400% noise: never 'matches' (40 of 40 runs)", `(${wild}/40)`);

// not enough to judge
check(analyze({ points: [], expected: "n" }).verdict === "unmeasured", "no points: unmeasured");
r = analyze({ points: [], expected: "n", error: { n: 256, name: "RecursionError" } });
check(r.verdict === "unmeasured" && /RecursionError/.test(r.message), "no points and an error: unmeasured, and the error is named", r.message);
r = analyze({ points: [{ n: 256, ns: 500_000 }, { n: 512, ns: 900_000 }], expected: "n", error: { n: 1024, name: "MemoryError" } });
check(r.verdict === "unclear" && /MemoryError/.test(r.message), "two points then a crash: unclear, the error is named", r.message);
check(analyze({ points: [{ n: 256, ns: 500_000 }, { n: 512, ns: 900_000 }], expected: "n", killed: true }).verdict === "unclear", "two points and the run was killed: unclear");
check(analyze({ points: [{ n: 256, ns: 1000 }, { n: 512, ns: 2000 }, { n: 1024, ns: 90_000 }], expected: "n" }).verdict === "unclear", "only one point above the noise floor: unclear");
check(analyze({ points: [{ n: 256, ns: 3000 }, { n: 512, ns: 6000 }], expected: "n" }).verdict === "matches" && INSTANT_NS === 50_000, "two tiny points (under 50 microseconds): instant, matches");

// ---------------------------------------------------------------- the program text and its parser
const config = JSON.parse(fs.readFileSync(new URL("../../content/build/complexity.json", import.meta.url), "utf8")).configs["peak-altitude"];
const nonce = "ab12cd34ef56";
const mine = "def peak_altitude(changes):\n    s = '$& $1 $$ __MAKE__ __NONCE__'\n    return max(0, sum(changes))\n";
const src = buildComplexityProgram({ code: mine, config, nonce });
check(src.includes(mine) && src.includes(`_NONCE = "${nonce}"`) && src.includes('_FN = "peak_altitude"') && src.includes("def _make(") && src.includes(JSON.stringify(config.sizes)), "the program contains the learner's code UNCHANGED (even with $&, $1 and our own placeholders in it), the marker, the function name, the generator and the sizes");
check(src.indexOf(mine) < src.indexOf("def _make("), "the learner's code comes first, then our generator, then the timing loop");
let threw = 0;
for (const bad of [{ nonce: "x" }, { nonce, config: { ...config, functionName: "os.system" } }, { nonce, config: { ...config, functionName: "Peak" } }]) { try { buildComplexityProgram({ code: mine, config, ...bad }); } catch { threw++; } }
check(threw === 3, "a bad marker or a bad function name is refused");
const out = [`@@C${nonce}@@256:5000:40@@`, `@@C${nonce}@@512:9000:20@@`, "hello from the learner", "@@Cdeadbeefdead@@1024:1:1@@", `@@C${nonce}@@1024:oops:3@@`, `@@C${nonce}@@ERR:2048:RecursionError@@`].join("\n");
const parsed = parseMeasurements(out, nonce);
check(parsed.points.length === 2 && parsed.points[1].n === 512 && parsed.points[1].ns === 9000 && parsed.points[1].reps === 20, "the parser reads the lines that carry our marker");
check(parsed.error?.n === 2048 && parsed.error.name === "RecursionError", "...and the error line");
check(!parsed.points.some((p) => p.ns === 1) && parsed.points.length === 2, "a forged line with a different marker, and a garbled line, are ignored");
check(parseMeasurements("", nonce).points.length === 0 && parseMeasurements("noise", nonce).error === null, "empty or unrelated output: no points, no error");

// ---------------------------------------------------------------- the whole chain with the local Python (no Judge0)
function runLocally(code, cfg) {
  const prog = buildComplexityProgram({ code, config: cfg, nonce });
  const started = Date.now();
  const res = spawnSync("python", ["-I", "-c", prog], { encoding: "utf8", timeout: 60_000 });
  return { res, seconds: (Date.now() - started) / 1000, ...parseMeasurements(res.stdout ?? "", nonce) };
}
const contentJson = JSON.parse(fs.readFileSync(new URL("../../content/build/content.json", import.meta.url), "utf8"));
const ref = (slug, approach) => contentJson.referenceSolutions.find((r) => r.problem === slug && r.language === "python" && r.approach === approach).code;
const refs = Object.fromEntries(["peak-altitude", "insert-position", "stair-ways"].map((slug) => [slug, { brute: ref(slug, "brute"), optimal: ref(slug, "optimal") }]));
let local = runLocally(refs["peak-altitude"].optimal, config);
let verdict = analyze({ points: local.points, expected: config.expected });
check(local.res.status === 0 && local.points.length >= 8 && verdict.verdict === "matches", "LOCAL python, peak-altitude, fast solution: runs, measures and the verdict is 'matches'", `(${local.points.length} sizes, exponent ${verdict.exponent}, ${local.seconds.toFixed(1)} s)`);
local = runLocally(refs["peak-altitude"].brute, config);
verdict = analyze({ points: local.points, expected: config.expected });
check(local.res.status === 0 && verdict.verdict === "slow" && near(verdict.exponent, 2, 0.45), "LOCAL python, peak-altitude, slow solution: the verdict is 'slow' with an exponent near 2", `(${local.points.length} sizes up to n=${verdict.measuredUpTo}, exponent ${verdict.exponent}, ${local.seconds.toFixed(1)} s)`);
check(local.seconds < 8, "the whole slow run finished inside the time budget", `(${local.seconds.toFixed(1)} s)`);
const cfgSearch = JSON.parse(fs.readFileSync(new URL("../../content/build/complexity.json", import.meta.url), "utf8")).configs["insert-position"];
local = runLocally(refs["insert-position"].brute, cfgSearch);
verdict = analyze({ points: local.points, expected: cfgSearch.expected });
check(verdict.verdict === "slow" && near(verdict.exponent, 1, 0.4), "LOCAL python, insert-position, linear scan where log n is expected: 'slow', exponent near 1", `(exponent ${verdict.exponent})`);
local = runLocally(refs["insert-position"].optimal, cfgSearch);
check(analyze({ points: local.points, expected: cfgSearch.expected }).verdict === "matches", "LOCAL python, insert-position, binary search: 'matches'");
const cfgStairs = JSON.parse(fs.readFileSync(new URL("../../content/build/complexity.json", import.meta.url), "utf8")).configs["stair-ways"];
local = runLocally(refs["stair-ways"].brute, cfgStairs);
verdict = analyze({ points: local.points, expected: cfgStairs.expected });
check(verdict.verdict === "slow" && verdict.exponential, "LOCAL python, stair-ways, plain recursion: 'slow' and recognised as exponential", `(${local.points.length} sizes, factor ${verdict.factor}, ${local.seconds.toFixed(1)} s)`);
local = runLocally("def count_ways(n):\n    raise ValueError('boom')\n", cfgStairs);
check(local.error?.name === "ValueError" && analyze({ points: local.points, expected: "n", error: local.error }).verdict === "unmeasured", "LOCAL python: a function that raises is reported as an error, not a crash of the analyzer");
local = runLocally("x = 1\n", cfgStairs);
check(local.error?.name === "MissingFunction", "LOCAL python: code that does not define the function is reported as MissingFunction");
local = runLocally("def count_ways(n):\n    print('@@C000000000000@@1:1:1@@')\n    return 1\n", cfgStairs);
check(local.points.length > 0 && !local.points.some((p) => p.ns === 1 && p.n === 1), "LOCAL python: a learner who prints a line shaped like ours but with a guessed marker cannot inject a point (the real marker is random for each run)");

console.log(failures === 0 ? "\nALL COMPLEXITY CHECKS PASSED" : `\n${failures} COMPLEXITY CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
