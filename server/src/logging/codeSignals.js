// Cheap signals read straight from the learner's code. Language-agnostic HEURISTICS (regex and tokens, not a real parser):
// good enough to compare many submissions, not exact. Pure functions, no I/O.

/** Removes comments and string contents so words inside them are not counted. */
export function stripNoise(code, language) {
  let s = String(code);
  if (language === "python") {
    s = s.replace(/("""|''')[\s\S]*?\1/g, '""').replace(/#.*$/gm, "");
    return s.replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g, '""');
  }
  s = s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  return s.replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/g, '""');
}

const count = (s, re) => (s.match(re) ?? []).length;

// How deeply loops are nested (a rough sign of O(n^2) or worse). Python uses indentation, the others use braces.
function loopDepth(stripped, language) {
  let best = 0;
  if (language === "python") {
    const stack = []; // indents of the loops we are inside
    for (const line of stripped.split("\n")) {
      if (!line.trim()) continue;
      const indent = line.match(/^[ \t]*/)[0].replace(/\t/g, "    ").length;
      while (stack.length && stack[stack.length - 1] >= indent) stack.pop();
      if (/^\s*(for|while)\b/.test(line)) { stack.push(indent); best = Math.max(best, stack.length); }
    }
    return best;
  }
  const stack = []; // true = this brace opened a loop body
  let pending = false, depth = 0;
  for (const token of stripped.match(/\b(?:for|while)\b|[{}]/g) ?? []) {
    if (token === "for" || token === "while") pending = true;
    else if (token === "{") { stack.push(pending); if (pending) { depth++; best = Math.max(best, depth); } pending = false; }
    else if (token === "}") { if (stack.pop()) depth--; }
  }
  return best;
}

/** @param {string} fnName the function the learner must write (calls to it inside its own body = recursion) */
export function codeStats(code, language, fnName) {
  const stripped = stripNoise(code, language);
  // the stored name is snake_case (peak_altitude) but Java and JavaScript use camelCase (peakAltitude): count both spellings
  const camel = fnName ? fnName.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase()) : "";
  const spellings = [...new Set([fnName, camel].filter(Boolean).map((n) => n.replace(/[^\w]/g, "")))];
  const calls = spellings.reduce((sum, n) => sum + count(stripped, new RegExp(`\\b${n}\\s*\\(`, "g")), 0);
  return {
    lines: String(code).replace(/\n$/, "").split("\n").length, // a trailing newline is not an extra line
    nonBlankLines: String(code).split("\n").filter((l) => l.trim()).length,
    chars: String(code).length,
    loops: count(stripped, /\b(for|while)\b/g),
    loopDepth: loopDepth(stripped, language),
    selfCalls: Math.max(0, calls - 1), // minus the definition itself
    usesSort: /\bsorted\s*\(|\.sort\s*\(|\bsort\s*\(|Arrays\.sort|Collections\.sort|std::sort/.test(stripped),
    usesHash: /\bdict\b|\bset\s*\(|\bdefaultdict\b|\bCounter\b|\bMap\b|\bSet\b|HashMap|HashSet|unordered_map|unordered_set|new Map|new Set|=\s*\{\s*\}/.test(stripped),
    usesHeap: /heapq|PriorityQueue|priority_queue|\bheap\b/i.test(stripped),
    usesStackQueue: /\bdeque\b|\bQueue\b|\bStack\b|\bArrayDeque\b|\bstack<|\bqueue</.test(stripped),
  };
}

// ---- how close is this code to our reference solutions? (an "approach" signal: brute / better / optimal)
const KEYWORDS = new Set(("if else elif for while return def class import from in not and or is None True False pass break continue lambda " +
  "int long bool boolean void string var let const function new this null undefined true false do switch case default static public private " +
  "final vector map set auto size_t unordered_map unordered_set range len print").split(" "));

function shingles(code, language) {
  const tokens = (stripNoise(code, language).match(/[A-Za-z_]\w*|\d+|==|!=|<=|>=|\+\+|--|&&|\|\||[^\s\w]/g) ?? [])
    .map((t) => (/^\d+$/.test(t) ? "NUM" : /^[A-Za-z_]/.test(t) ? (KEYWORDS.has(t) ? t : "ID") : t));
  const out = new Set();
  for (let i = 0; i + 3 <= tokens.length; i++) out.add(tokens.slice(i, i + 3).join(" "));
  return out;
}
const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
};

/**
 * @param {{approach:string, code:string}[]} references reference solutions for the same problem and language
 * @returns {{closest:string, similarity:number, byApproach:Record<string,number>} | null}
 */
export function approachSimilarity(code, language, references) {
  if (!references?.length) return null;
  const mine = shingles(code, language);
  const byApproach = {};
  for (const ref of references) {
    const s = jaccard(mine, shingles(ref.code, language));
    byApproach[ref.approach] = Math.max(byApproach[ref.approach] ?? 0, s);
  }
  const [closest, best] = Object.entries(byApproach).sort((a, b) => b[1] - a[1])[0];
  const round = (x) => Math.round(x * 100) / 100;
  return { closest, similarity: round(best), byApproach: Object.fromEntries(Object.entries(byApproach).map(([k, v]) => [k, round(v)])) };
}
